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
	import ImagenesEjercicio from '#lib/components/ImagenesEjercicio.svelte';
	import Check from '@lucide/svelte/icons/check';
	import Play from '@lucide/svelte/icons/play';
	import Square from '@lucide/svelte/icons/square';
	import Plus from '@lucide/svelte/icons/plus';
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import ArrowDown from '@lucide/svelte/icons/arrow-down';
	import X from '@lucide/svelte/icons/x';
	import Info from '@lucide/svelte/icons/info';
	import Timer from '@lucide/svelte/icons/timer';
	import SkipForward from '@lucide/svelte/icons/skip-forward';
	import Trophy from '@lucide/svelte/icons/trophy';

	let s = $state<SesionEnCurso | null>(null);
	let ahora = $state(Date.now());
	let descansoFin = $state<number | null>(null);
	let descansoTotal = $state(60);
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
	/** Primer ejercicio con series pendientes: se destaca como "el actual". */
	const actual = $derived(s?.ejercicios.findIndex((e) => e.series.some((x) => !x.hecha)) ?? -1);
	const progresoDescanso = $derived(descansoFin ? Math.max(0, Math.min(1, restante / descansoTotal)) : 0);
	const R = 54;
	const CIRC = 2 * Math.PI * R;

	function sumarDescanso(seg: number) {
		if (!descansoFin) return;
		descansoFin += seg * 1000;
		descansoTotal += seg;
	}

	function marcar(ei: number, si: number, valor?: boolean) {
		if (!s) return;
		const ej = s.ejercicios[ei];
		const serie = ej.series[si];
		serie.hecha = valor ?? !serie.hecha;
		if (serie.hecha && ej.descansoSeg > 0) {
			descansoTotal = ej.descansoSeg;
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
			<div class="titulo">
				<span class="etiqueta">Entrenando</span>
				<h1>{s.rutinaNombre}</h1>
			</div>
			<button class="primary terminar" onclick={() => (terminando = true)}>Terminar</button>
		</div>
		<div class="marcadores">
			<div><b class="reloj">{duracion(transcurrido)}</b><span>Tiempo</span></div>
			<div><b>{hechas}<small>/{totalSeries}</small></b><span>Series</span></div>
			<div><b>{totalSeries ? Math.round((hechas / totalSeries) * 100) : 0}<small>%</small></b><span>Progreso</span></div>
		</div>
		<div class="bar"><div style="width: {totalSeries ? (hechas / totalSeries) * 100 : 0}%"></div></div>
	</header>

	{#each s.ejercicios as ej, ei (ej.ejercicioId + '-' + ei)}
		{@const info = $ejercicios?.get(ej.ejercicioId)}
		{@const completo = ej.series.length > 0 && ej.series.every((x) => x.hecha)}
		<section class="ejercicio" class:actual={ei === actual} class:completo>
			<div class="cabecera">
				<ImagenesEjercicio imagenes={info?.imagenes} nombre={ej.nombre} tamano="mini" />
				<div class="nombre">
					<span class="n">{completo ? '✓ Completado' : ei === actual ? 'Ahora' : `Ejercicio ${ei + 1}`}</span>
					<h3>{ej.nombre}</h3>
				</div>
				<div class="acciones">
					<button class="ghost icon-btn" onclick={() => mover(ei, -1)} aria-label="Subir"><ArrowUp size={18} /></button>
					<button class="ghost icon-btn" onclick={() => mover(ei, 1)} aria-label="Bajar"><ArrowDown size={18} /></button>
					<button class="ghost icon-btn danger" onclick={() => quitarEjercicio(ei)} aria-label="Quitar"><X size={18} /></button>
				</div>
			</div>

			<div class="opciones">
				{#if info?.instrucciones?.length || info?.imagenes?.length || info?.notas}
					<button class="small ghost tec" onclick={() => (tecnica = tecnica === ei ? null : ei)} aria-expanded={tecnica === ei}>
						<Info size={16} /> {tecnica === ei ? 'Ocultar técnica' : 'Ver técnica'}
					</button>
				{/if}
				<label class="rest-cfg">
					<Timer size={15} />
					<input type="number" min="0" step="15" bind:value={ej.descansoSeg} aria-label="Descanso en segundos" />
					<span>s descanso</span>
				</label>
			</div>
			{#if tecnica === ei && info}
				<div class="tecnica"><DetalleEjercicio ejercicio={info} /></div>
			{/if}

			<div class="sets">
				<div class="set head">
					<span>Serie</span>
					{#if ej.tipo === 'tiempo'}
						<span>Segundos</span><span></span>
					{:else}
						<span>Reps</span><span>Kg</span>
					{/if}
					<span></span>
				</div>
				{#each ej.series as serie, si (si)}
					<div class="set" class:done={serie.hecha}>
						<button class="ghost num" onclick={() => quitarSerie(ei, si)} title="Mantén para quitar la serie" aria-label="Quitar serie {si + 1}">{si + 1}</button>
						{#if ej.tipo === 'tiempo'}
							<input type="number" inputmode="numeric" min="0" bind:value={serie.segundos} aria-label="Segundos" />
							{#if cuenta && cuenta.ei === ei && cuenta.si === si}
								<button class="energy cuenta" onclick={() => (cuenta = null)}>
									<Square size={14} fill="currentColor" /> {Math.ceil((cuenta.fin - ahora) / 1000)}
								</button>
							{:else}
								<button class="cuenta" onclick={() => iniciarCuenta(ei, si)} disabled={serie.hecha} aria-label="Iniciar cronómetro">
									<Play size={18} fill="currentColor" />
								</button>
							{/if}
						{:else}
							<input type="number" inputmode="numeric" min="0" bind:value={serie.reps} aria-label="Repeticiones" />
							<input type="number" inputmode="decimal" min="0" step="0.5" placeholder="—" bind:value={serie.peso} aria-label="Peso en kg" />
						{/if}
						<button class="check" class:on={serie.hecha} onclick={() => marcar(ei, si)} aria-label="Marcar serie {si + 1}" aria-pressed={serie.hecha}>
							<Check size={24} strokeWidth={3} />
						</button>
					</div>
				{/each}
			</div>
			<button class="small ghost agregar-serie" onclick={() => agregarSerie(ei)}><Plus size={16} /> Agregar serie</button>
		</section>
	{/each}

	{#if agregando}
		<div class="card stack">
			<div class="spread">
				<h3>Agregar ejercicio</h3>
				<button class="ghost icon-btn" onclick={() => (agregando = false)} aria-label="Cerrar"><X size={20} /></button>
			</div>
			<SelectorEjercicio onelegir={agregarEjercicio} />
		</div>
	{:else}
		<button class="block" onclick={() => (agregando = true)}><Plus size={18} /> Agregar ejercicio</button>
	{/if}

	<button class="ghost danger block descartar" onclick={descartar}>Descartar entreno</button>
	{#if descansoFin}<div class="hueco" aria-hidden="true"></div>{/if}

	{#if descansoFin}
		<div class="rest" role="timer" aria-live="polite">
			<div class="anillo">
				<svg viewBox="0 0 120 120" aria-hidden="true">
					<circle cx="60" cy="60" r={R} class="fondo" />
					<circle cx="60" cy="60" r={R} class="avance" stroke-dasharray={CIRC} stroke-dashoffset={CIRC * (1 - progresoDescanso)} />
				</svg>
				<b>{duracion(restante)}</b>
			</div>
			<div class="rest-info">
				<span class="etiqueta">Descanso</span>
				<span class="siguiente">
					{#if actual >= 0}Sigue: <b>{s.ejercicios[actual].nombre}</b>{:else}¡Último descanso!{/if}
				</span>
				<div class="row">
					<button class="small" onclick={() => sumarDescanso(15)}>+15 s</button>
					<button class="small saltar" onclick={() => (descansoFin = null)}><SkipForward size={16} /> Saltar</button>
				</div>
			</div>
		</div>
	{/if}

	{#if terminando}
		<div class="overlay" role="dialog" aria-modal="true" aria-labelledby="fin-titulo">
			<div class="sheet stack">
				<div class="trofeo"><Trophy size={40} /></div>
				<h2 id="fin-titulo">¡Buen trabajo!</h2>
				<div class="resumen">
					<div><b>{duracion(transcurrido)}</b><span>Tiempo</span></div>
					<div><b>{hechas}</b><span>Series</span></div>
					<div><b>{s.ejercicios.filter((e) => e.series.some((x) => x.hecha)).length}</b><span>Ejercicios</span></div>
				</div>
				<label>
					Esfuerzo percibido: <b class="esfuerzo">{esfuerzo}/10</b>
					<input type="range" min="1" max="10" bind:value={esfuerzo} />
				</label>
				<label>
					Notas (cómo te sentiste, molestias, etc.)
					<textarea bind:value={notas}></textarea>
				</label>
				<button class="primary block grande" onclick={guardar}>Guardar entreno</button>
				<button class="block ghost" onclick={() => (terminando = false)}>Seguir entrenando</button>
			</div>
		</div>
	{/if}
{/if}

<style>
	.top {
		position: sticky;
		top: 0;
		margin: 0 -16px 14px;
		padding: calc(10px + env(safe-area-inset-top)) 16px 12px;
		background: rgb(8 9 12 / 0.92);
		backdrop-filter: blur(14px);
		-webkit-backdrop-filter: blur(14px);
		border-bottom: 1px solid var(--border);
		z-index: 5;
	}
	.titulo {
		min-width: 0;
	}
	.etiqueta {
		font-family: var(--font-display);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-size: 0.8rem;
		color: var(--accent);
	}
	.top h1 {
		margin: 0;
		font-size: 1.7rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.terminar {
		padding: 8px 18px;
	}
	.marcadores {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		margin-top: 10px;
	}
	.marcadores div {
		display: flex;
		flex-direction: column;
	}
	.marcadores b {
		font-family: var(--font-display);
		font-size: 1.9rem;
		font-weight: 800;
		line-height: 1;
		font-variant-numeric: tabular-nums;
	}
	.marcadores small {
		font-size: 1rem;
		color: var(--muted);
	}
	.marcadores span {
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--muted);
	}
	.reloj {
		color: var(--accent);
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
		background: linear-gradient(90deg, var(--accent), #7dff6b);
		border-radius: 3px;
		transition: width 0.3s;
	}

	.ejercicio {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 14px;
		margin-bottom: 12px;
		transition:
			border-color 0.2s,
			opacity 0.2s;
	}
	.ejercicio.actual {
		border-color: var(--accent);
		box-shadow: 0 0 0 3px var(--accent-soft);
	}
	.ejercicio.completo {
		opacity: 0.6;
	}
	.cabecera {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.nombre {
		flex: 1;
		min-width: 0;
	}
	.nombre h3 {
		margin: 0;
		font-size: 1.35rem;
	}
	.n {
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--muted);
	}
	.actual .n {
		color: var(--accent);
	}
	.completo .n {
		color: var(--accent);
	}
	.acciones {
		display: flex;
		margin-right: -8px;
	}
	.acciones .icon-btn {
		width: 36px;
		height: 36px;
		color: var(--muted);
	}
	.acciones .danger {
		color: var(--danger);
	}
	.opciones {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 6px;
		margin: 10px 0;
	}
	.tec {
		padding-left: 0;
		color: var(--accent);
	}
	.rest-cfg {
		display: flex;
		align-items: center;
		gap: 6px;
		margin: 0;
		text-transform: none;
		letter-spacing: normal;
		font-weight: 500;
	}
	.rest-cfg input {
		width: 62px;
		min-height: 34px;
		padding: 4px 6px;
		margin: 0;
		text-align: center;
	}
	.tecnica {
		margin: 4px 0 12px;
	}
	.sets {
		display: grid;
		gap: 8px;
		margin-bottom: 4px;
	}
	.set {
		display: grid;
		grid-template-columns: 44px 1fr 1fr 56px;
		gap: 8px;
		align-items: center;
	}
	.set.head {
		font-size: 0.68rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--muted);
		text-align: center;
	}
	.set input {
		text-align: center;
		min-height: 52px;
		font-family: var(--font-display);
		font-size: 1.5rem;
		font-weight: 700;
		padding: 4px;
	}
	.set.done input {
		background: var(--accent-soft);
		border-color: transparent;
		color: var(--accent);
	}
	.num {
		min-height: 52px;
		padding: 0;
		font-family: var(--font-display);
		font-size: 1.3rem;
		color: var(--muted);
	}
	.check {
		width: 56px;
		height: 52px;
		min-height: 0;
		padding: 0;
		color: var(--muted);
		border-radius: 14px;
	}
	.check.on {
		background: var(--accent);
		border-color: var(--accent);
		color: var(--accent-ink);
	}
	.cuenta {
		min-height: 52px;
		font-size: 1.3rem;
	}
	.agregar-serie {
		color: var(--muted);
		padding-left: 0;
	}
	.descartar {
		margin-top: 8px;
	}

	.hueco {
		height: 150px;
	}

	/* Descanso: panel inferior con anillo de progreso */
	.rest {
		position: fixed;
		left: 12px;
		right: 12px;
		bottom: calc(12px + env(safe-area-inset-bottom));
		max-width: 520px;
		margin: 0 auto;
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 14px 16px;
		border-radius: 24px;
		background: var(--surface-2);
		border: 1px solid var(--accent);
		box-shadow: 0 -10px 40px rgb(0 0 0 / 0.6);
		z-index: 20;
	}
	.anillo {
		position: relative;
		width: 104px;
		height: 104px;
		flex: none;
	}
	.anillo svg {
		width: 100%;
		height: 100%;
		transform: rotate(-90deg);
	}
	.anillo circle {
		fill: none;
		stroke-width: 10;
	}
	.anillo .fondo {
		stroke: var(--surface-3);
	}
	.anillo .avance {
		stroke: var(--accent);
		stroke-linecap: round;
		transition: stroke-dashoffset 0.5s linear;
	}
	.anillo b {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		font-family: var(--font-display);
		font-size: 2rem;
		font-weight: 800;
		font-variant-numeric: tabular-nums;
	}
	.rest-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.siguiente {
		font-size: 0.85rem;
		color: var(--muted);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.siguiente b {
		color: var(--text);
	}
	.saltar {
		background: var(--accent);
		border-color: var(--accent);
		color: var(--accent-ink);
	}

	/* Fin del entreno */
	.overlay {
		position: fixed;
		inset: 0;
		background: rgb(0 0 0 / 0.7);
		display: flex;
		align-items: flex-end;
		justify-content: center;
		z-index: 30;
	}
	.sheet {
		width: 100%;
		max-width: 560px;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 28px 28px 0 0;
		padding: 22px 18px calc(18px + env(safe-area-inset-bottom));
		max-height: 92vh;
		overflow-y: auto;
	}
	.trofeo {
		width: 72px;
		height: 72px;
		margin: 0 auto;
		border-radius: 50%;
		display: grid;
		place-items: center;
		background: var(--accent);
		color: var(--accent-ink);
	}
	.sheet h2 {
		justify-content: center;
		font-size: 2rem;
		font-style: italic;
		margin: 10px 0 4px;
	}
	.sheet h2::before {
		display: none;
	}
	.resumen {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		text-align: center;
		padding: 12px 0;
		border-top: 1px solid var(--border);
		border-bottom: 1px solid var(--border);
	}
	.resumen div {
		display: flex;
		flex-direction: column;
	}
	.resumen b {
		font-family: var(--font-display);
		font-size: 1.9rem;
		font-weight: 800;
	}
	.resumen span {
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		color: var(--muted);
	}
	.esfuerzo {
		color: var(--accent);
		font-size: 1rem;
	}
	.grande {
		min-height: 56px;
		font-size: 1.3rem;
	}
</style>
