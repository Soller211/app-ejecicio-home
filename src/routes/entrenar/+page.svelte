<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { liveQuery } from 'dexie';
	import { db } from '#lib/db.ts';
	import {
		ejercicioParaSesion,
		finalizar,
		guardarEnCurso,
		iniciarDesdeRutina,
		iniciarLibre,
		sesionEnCurso,
		type SesionEnCurso
	} from '#lib/sesion.ts';
	import { duracion, pitido, vibrar } from '#lib/util.ts';
	import type { Ejercicio } from '#lib/db.ts';
	import DetalleEjercicio from '#lib/components/DetalleEjercicio.svelte';
	import SelectorEjercicio from '#lib/components/SelectorEjercicio.svelte';

	let s = $state<SesionEnCurso | null>(null);
	let ahora = $state(Date.now());
	let descansoFin = $state<number | null>(null);
	let cuenta = $state<{ ei: number; si: number; fin: number } | null>(null);
	let terminando = $state(false);
	let esfuerzo = $state(7);
	let notas = $state('');
	let tecnica = $state<number | null>(null);
	let agregando = $state(false);
	let error = $state('');

	const ejercicios = liveQuery(async () => new Map((await db.ejercicios.toArray()).map((e) => [e.id, e])));

	onMount(() => {
		(async () => {
			const params = page.url.searchParams;
			const rutinaId = Number(params.get('rutina')) || undefined;
			const actual = sesionEnCurso();
			if (actual && (!rutinaId || actual.rutinaId === rutinaId)) {
				s = actual;
			} else if (
				actual &&
				!confirm(`Tienes "${actual.rutinaNombre}" en curso. ¿Descartarlo y empezar otro?`)
			) {
				s = actual;
			} else if (rutinaId) {
				s = await iniciarDesdeRutina(rutinaId);
				if (!s) error = 'No se encontró la rutina.';
			} else {
				s = iniciarLibre();
			}
		})();

		const t = setInterval(() => (ahora = Date.now()), 500);
		// Mantiene la pantalla encendida mientras entrenas (si el navegador lo permite).
		let lock: WakeLockSentinel | undefined;
		navigator.wakeLock?.request('screen').then((l) => (lock = l)).catch(() => {});
		return () => {
			clearInterval(t);
			lock?.release();
		};
	});

	// Guarda el progreso en cada cambio.
	$effect(() => {
		if (s) guardarEnCurso($state.snapshot(s) as SesionEnCurso);
	});

	// Fin de descanso / fin de serie cronometrada.
	$effect(() => {
		if (descansoFin && ahora >= descansoFin) {
			descansoFin = null;
			pitido();
			vibrar([200, 100, 200]);
		}
	});
	$effect(() => {
		if (s && cuenta && ahora >= cuenta.fin) {
			const { ei, si } = cuenta;
			cuenta = null;
			pitido();
			vibrar(300);
			marcar(ei, si, true);
		}
	});

	const transcurrido = $derived(s ? (ahora - new Date(s.inicio).getTime()) / 1000 : 0);
	const restante = $derived(descansoFin ? (descansoFin - ahora) / 1000 : 0);
	const totalSeries = $derived(s?.ejercicios.reduce((n, e) => n + e.series.length, 0) ?? 0);
	const hechas = $derived(
		s?.ejercicios.reduce((n, e) => n + e.series.filter((x) => x.hecha).length, 0) ?? 0
	);

	function marcar(ei: number, si: number, valor?: boolean) {
		if (!s) return;
		const ej = s.ejercicios[ei];
		const serie = ej.series[si];
		serie.hecha = valor ?? !serie.hecha;
		if (serie.hecha && ej.descansoSeg > 0) {
			descansoFin = Date.now() + ej.descansoSeg * 1000;
			vibrar(50);
		}
	}

	function iniciarCuenta(ei: number, si: number) {
		const seg = s?.ejercicios[ei].series[si].segundos ?? 30;
		descansoFin = null;
		cuenta = { ei, si, fin: Date.now() + seg * 1000 };
	}

	function agregarSerie(ei: number) {
		if (!s) return;
		const series = s.ejercicios[ei].series;
		const ult = series.at(-1);
		series.push({ ...(ult ?? { reps: 10 }), hecha: false });
	}

	function quitarSerie(ei: number, si: number) {
		if (!s) return;
		s.ejercicios[ei].series.splice(si, 1);
	}

	function mover(ei: number, d: number) {
		if (!s) return;
		const j = ei + d;
		if (j < 0 || j >= s.ejercicios.length) return;
		const [x] = s.ejercicios.splice(ei, 1);
		s.ejercicios.splice(j, 0, x);
	}

	function quitarEjercicio(ei: number) {
		if (s && confirm(`¿Quitar ${s.ejercicios[ei].nombre} de este entreno?`)) s.ejercicios.splice(ei, 1);
	}

	async function agregarEjercicio(ej: Ejercicio) {
		if (!s) return;
		s.ejercicios.push(await ejercicioParaSesion(ej, 3, { reps: 10, segundos: 30 }, 60));
		agregando = false;
	}

	async function guardar() {
		if (!s) return;
		if (hechas === 0 && !confirm('No marcaste ninguna serie. ¿Guardar de todos modos?')) return;
		await finalizar($state.snapshot(s) as SesionEnCurso, { esfuerzo, notas: notas.trim() || undefined });
		goto('/historial');
	}

	function descartar() {
		if (!confirm('¿Descartar este entreno? No se guardará nada.')) return;
		guardarEnCurso(null);
		s = null;
		goto('/');
	}
</script>

{#if error}
	<p class="empty">{error} <a href="/">Volver</a></p>
{:else if !s}
	<p class="empty">Cargando…</p>
{:else}
	<header class="top">
		<div class="spread">
			<div>
				<h1>{s.rutinaNombre}</h1>
				<span class="muted">⏱ {duracion(transcurrido)} · {hechas}/{totalSeries} series</span>
			</div>
			<button class="primary" onclick={() => (terminando = true)}>Terminar</button>
		</div>
		<div class="bar"><div style="width: {totalSeries ? (hechas / totalSeries) * 100 : 0}%"></div></div>
	</header>

	{#if descansoFin}
		<div class="rest">
			<span>Descanso</span>
			<b>{duracion(restante)}</b>
			<div class="row">
				<button class="small" onclick={() => (descansoFin = (descansoFin ?? 0) + 15000)}>+15s</button>
				<button class="small" onclick={() => (descansoFin = null)}>Saltar</button>
			</div>
		</div>
	{/if}

	{#each s.ejercicios as ej, ei (ej.ejercicioId + '-' + ei)}
		<section class="card">
			<div class="spread">
				<h3>{ej.nombre}</h3>
				<div class="row">
					<button class="small ghost" onclick={() => mover(ei, -1)} aria-label="Subir">↑</button>
					<button class="small ghost" onclick={() => mover(ei, 1)} aria-label="Bajar">↓</button>
					<button class="small ghost danger" onclick={() => quitarEjercicio(ei)} aria-label="Quitar">✕</button>
				</div>
			</div>
			{#if $ejercicios?.get(ej.ejercicioId)?.instrucciones?.length || $ejercicios?.get(ej.ejercicioId)?.imagenes?.length || $ejercicios?.get(ej.ejercicioId)?.notas}
				<button class="small ghost tec" onclick={() => (tecnica = tecnica === ei ? null : ei)} aria-expanded={tecnica === ei}>
					{tecnica === ei ? 'Ocultar técnica' : 'ℹ️ Ver técnica'}
				</button>
				{#if tecnica === ei}
					<DetalleEjercicio ejercicio={$ejercicios.get(ej.ejercicioId)!} />
				{/if}
			{/if}
			<label class="rest-cfg">
				Descanso
				<input type="number" min="0" step="15" bind:value={ej.descansoSeg} /> s
			</label>

			<div class="sets">
				<div class="set head">
					<span>#</span>
					{#if ej.tipo === 'tiempo'}
						<span>Segundos</span><span></span>
					{:else}
						<span>Reps</span><span>Peso (kg)</span>
					{/if}
					<span></span>
				</div>
				{#each ej.series as serie, si (si)}
					<div class="set" class:done={serie.hecha}>
						<button class="small ghost num" onclick={() => quitarSerie(ei, si)} title="Quitar serie">{si + 1}</button>
						{#if ej.tipo === 'tiempo'}
							<input type="number" inputmode="numeric" min="0" bind:value={serie.segundos} />
							{#if cuenta && cuenta.ei === ei && cuenta.si === si}
								<button class="small" onclick={() => (cuenta = null)}>{Math.ceil((cuenta.fin - ahora) / 1000)}s ■</button>
							{:else}
								<button class="small" onclick={() => iniciarCuenta(ei, si)} disabled={serie.hecha}>▶</button>
							{/if}
						{:else}
							<input type="number" inputmode="numeric" min="0" bind:value={serie.reps} />
							<input type="number" inputmode="decimal" min="0" step="0.5" placeholder="—" bind:value={serie.peso} />
						{/if}
						<button class="check" class:on={serie.hecha} onclick={() => marcar(ei, si)} aria-label="Marcar serie">✓</button>
					</div>
				{/each}
			</div>
			<button class="small ghost" onclick={() => agregarSerie(ei)}>+ Serie</button>
		</section>
	{/each}

	{#if agregando}
		<div class="card stack">
			<div class="spread">
				<h3>Agregar ejercicio</h3>
				<button class="small ghost" onclick={() => (agregando = false)}>Cerrar</button>
			</div>
			<SelectorEjercicio onelegir={agregarEjercicio} />
		</div>
	{:else}
		<button class="block" onclick={() => (agregando = true)}>+ Agregar ejercicio</button>
	{/if}

	<button class="ghost danger block" onclick={descartar}>Descartar entreno</button>

	{#if terminando}
		<div class="overlay" role="dialog" aria-modal="true">
			<div class="card sheet stack">
				<h2>¡Buen trabajo! 💪</h2>
				<p class="muted">{duracion(transcurrido)} · {hechas} series completadas</p>
				<label>
					Esfuerzo percibido: <b>{esfuerzo}/10</b>
					<input type="range" min="1" max="10" bind:value={esfuerzo} />
				</label>
				<label>
					Notas (cómo te sentiste, molestias, etc.)
					<textarea bind:value={notas}></textarea>
				</label>
				<div class="row">
					<button class="primary" onclick={guardar}>Guardar entreno</button>
					<button onclick={() => (terminando = false)}>Seguir entrenando</button>
				</div>
			</div>
		</div>
	{/if}
{/if}

<style>
	.top {
		position: sticky;
		top: 0;
		background: var(--bg);
		padding: 8px 0 10px;
		z-index: 5;
	}
	.top h1 {
		margin: 0;
		font-size: 1.25rem;
	}
	.bar {
		height: 6px;
		background: var(--surface-2);
		border-radius: 3px;
		margin-top: 10px;
		overflow: hidden;
	}
	.bar div {
		height: 100%;
		background: var(--accent);
		transition: width 0.3s;
	}
	.rest {
		position: fixed;
		left: 16px;
		right: 16px;
		bottom: calc(16px + env(safe-area-inset-bottom));
		max-width: 688px;
		margin: 0 auto;
		background: var(--accent);
		color: var(--accent-ink);
		border-radius: var(--radius);
		padding: 12px 16px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		z-index: 20;
		box-shadow: 0 8px 24px rgb(0 0 0 / 0.35);
	}
	.rest b {
		font-size: 1.8rem;
		font-variant-numeric: tabular-nums;
	}
	.rest button {
		background: rgb(0 0 0 / 0.15);
		border-color: transparent;
		color: inherit;
	}
	.rest-cfg {
		display: flex;
		align-items: center;
		gap: 6px;
		margin: 4px 0 8px;
	}
	.rest-cfg input {
		width: 80px;
		min-height: 32px;
		padding: 4px 8px;
		margin: 0;
	}
	.sets {
		display: grid;
		gap: 6px;
		margin-bottom: 6px;
	}
	.set {
		display: grid;
		grid-template-columns: 36px 1fr 1fr 48px;
		gap: 6px;
		align-items: center;
	}
	.set.head {
		font-size: 0.75rem;
		color: var(--muted);
		text-align: center;
	}
	.set input {
		text-align: center;
		padding: 8px 4px;
	}
	.set.done input {
		opacity: 0.6;
	}
	.num {
		padding: 0;
		color: var(--muted);
	}
	.check {
		padding: 0;
		font-size: 1.2rem;
		color: var(--muted);
	}
	.check.on {
		background: var(--accent);
		border-color: var(--accent);
		color: var(--accent-ink);
	}
	.tec {
		padding-left: 0;
		color: var(--accent);
		margin-bottom: 6px;
	}
	.overlay {
		position: fixed;
		inset: 0;
		background: rgb(0 0 0 / 0.6);
		display: flex;
		align-items: flex-end;
		justify-content: center;
		z-index: 30;
		padding: 16px;
	}
	.sheet {
		width: 100%;
		max-width: 520px;
	}
	.sheet h2 {
		margin-top: 0;
	}
</style>
