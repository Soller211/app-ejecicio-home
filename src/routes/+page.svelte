<script lang="ts">
	import { liveQuery } from 'dexie';
	import { db, type Rutina } from '#lib/db.ts';
	import { fechaCorta, inicioSemana, minutosSesion, rachaSemanas, seriesHechas } from '#lib/util.ts';
	import { sesionEnCurso } from '#lib/sesion.ts';
	import ImagenesEjercicio from '#lib/components/ImagenesEjercicio.svelte';
	import Settings from '@lucide/svelte/icons/settings';
	import Play from '@lucide/svelte/icons/play';
	import Flame from '@lucide/svelte/icons/flame';
	import Timer from '@lucide/svelte/icons/timer';
	import Dumbbell from '@lucide/svelte/icons/dumbbell';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Zap from '@lucide/svelte/icons/zap';
	import Plus from '@lucide/svelte/icons/plus';

	const sesiones = liveQuery(() => db.sesiones.orderBy('inicio').reverse().toArray());
	const rutinas = liveQuery(() => db.rutinas.toArray());
	const ejercicios = liveQuery(async () => new Map((await db.ejercicios.toArray()).map((e) => [e.id, e])));
	const ultimoPeso = liveQuery(() =>
		db.corporal
			.orderBy('fecha')
			.reverse()
			.filter((r) => r.peso != null)
			.first()
	);

	const enCurso = sesionEnCurso();
	const lunes = inicioSemana(new Date());

	const estaSemana = $derived(
		($sesiones ?? []).filter((s) => new Date(s.inicio).getTime() >= lunes.getTime())
	);
	const racha = $derived(rachaSemanas($sesiones ?? []));
	const ultima = $derived($sesiones?.[0]);

	/** L a D de esta semana, marcando los días con entreno. */
	const dias = $derived.by(() => {
		const hoy = new Date().toDateString();
		return ['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((letra, i) => {
			const d = new Date(lunes);
			d.setDate(d.getDate() + i);
			const clave = d.toDateString();
			return {
				letra,
				hecho: estaSemana.some((s) => new Date(s.inicio).toDateString() === clave),
				hoy: clave === hoy,
				futuro: d.getTime() > Date.now()
			};
		});
	});

	/** Rutina sugerida: la que hace más tiempo no haces (o nunca). */
	const sugerida = $derived.by(() => {
		const lista = $rutinas ?? [];
		if (!lista.length) return undefined;
		const ultimaVez = (r: Rutina) =>
			($sesiones ?? []).find((s) => s.rutinaId === r.id)?.inicio ?? '';
		return [...lista].sort((a, b) => ultimaVez(a).localeCompare(ultimaVez(b)))[0];
	});
	const otras = $derived(($rutinas ?? []).filter((r) => r.id !== sugerida?.id));

	/** Estimación: ~40 s por serie más el descanso. */
	const minutos = (r: Rutina) =>
		Math.max(
			5,
			Math.round(r.items.reduce((t, it) => t + it.series * (40 + it.descansoSeg), 0) / 60)
		);

	const saludo = (() => {
		const h = new Date().getHours();
		return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
	})();
	const lugarTxt = { casa: 'Casa', gym: 'Gimnasio', ambos: 'Casa o gym' } as const;
</script>

<header class="spread top">
	<div>
		<p class="saludo">{saludo}</p>
		<h1>A entrenar</h1>
	</div>
	<a class="btn icon-btn" href="/ajustes" aria-label="Ajustes"><Settings size={20} /></a>
</header>

{#if enCurso}
	<a class="resume" href="/entrenar">
		<span class="pulso" aria-hidden="true"></span>
		<span>
			<b>Entreno en curso</b>
			<span class="muted">{enCurso.rutinaNombre} · toca para continuar</span>
		</span>
		<ChevronRight size={22} />
	</a>
{/if}

<section class="semana card" aria-label="Tu semana">
	<div class="spread">
		<span class="etiqueta">Tu semana</span>
		<span class="racha"><Flame size={16} /> {racha === 1 ? '1 semana seguida' : `${racha} semanas seguidas`}</span>
	</div>
	<ol class="dias">
		{#each dias as d, i (i)}
			<li class:hecho={d.hecho} class:hoy={d.hoy} class:futuro={d.futuro}>
				<span class="punto">{#if d.hecho}<Zap size={14} fill="currentColor" />{/if}</span>
				<span class="letra">{d.letra}</span>
			</li>
		{/each}
	</ol>
</section>

{#if sugerida}
	<section class="hero" aria-label="Rutina de hoy">
		<span class="etiqueta">Rutina de hoy</span>
		<h2 class="hero-titulo">{sugerida.nombre}</h2>
		<div class="row meta">
			<span><Dumbbell size={15} /> {sugerida.items.length} ejercicios</span>
			<span><Timer size={15} /> ~{minutos(sugerida)} min</span>
			<span>{lugarTxt[sugerida.lugar]}</span>
		</div>
		<div class="miniaturas">
			{#each sugerida.items.slice(0, 5) as it, i (i)}
				{@const e = $ejercicios?.get(it.ejercicioId)}
				<ImagenesEjercicio imagenes={e?.imagenes} nombre={e?.nombre ?? ''} tamano="mini" />
			{/each}
			{#if sugerida.items.length > 5}<span class="mas">+{sugerida.items.length - 5}</span>{/if}
		</div>
		<a class="btn primary empezar" href="/entrenar?rutina={sugerida.id}">
			<Play size={20} fill="currentColor" /> Empezar
		</a>
	</section>
{:else if $rutinas}
	<a class="hero vacio" href="/rutinas/editar">
		<span class="etiqueta">Empieza aquí</span>
		<h2 class="hero-titulo">Crea tu primera rutina</h2>
		<span class="btn primary empezar"><Plus size={20} /> Crear rutina</span>
	</a>
{/if}

<div class="stats">
	<div class="stat"><b>{estaSemana.length}</b><span>Semana</span></div>
	<div class="stat"><b>{$sesiones?.length ?? 0}</b><span>Entrenos</span></div>
	<div class="stat">
		<b>{$ultimoPeso?.peso ?? '—'}{#if $ultimoPeso?.peso}<small>kg</small>{/if}</b>
		<span>Peso</span>
	</div>
</div>

{#if otras.length}
	<h2>Otras rutinas</h2>
	<div class="carrusel">
		{#each otras as r (r.id)}
			<a class="mini-rutina" href="/entrenar?rutina={r.id}">
				<span class="chip">{lugarTxt[r.lugar]}</span>
				<b>{r.nombre}</b>
				<span class="muted">{r.items.length} ejercicios · ~{minutos(r)} min</span>
				<span class="play"><Play size={16} fill="currentColor" /></span>
			</a>
		{/each}
	</div>
{/if}

<a class="btn block libre" href="/entrenar?libre=1"><Zap size={18} /> Entreno libre</a>

{#if ultima}
	<h2>Último entreno</h2>
	<a class="card ultima" href="/historial">
		<div class="spread">
			<b>{ultima.rutinaNombre}</b>
			<span class="chip fecha">{fechaCorta(ultima.inicio)}</span>
		</div>
		<div class="row cifras">
			<span><b>{minutosSesion(ultima)}</b> min</span>
			<span><b>{seriesHechas(ultima)}</b> series</span>
			{#if ultima.esfuerzo}<span><b>{ultima.esfuerzo}</b>/10 esfuerzo</span>{/if}
		</div>
	</a>
{/if}

<style>
	.top {
		align-items: flex-end;
	}
	.saludo {
		margin: 8px 0 0;
		color: var(--muted);
		font-weight: 600;
	}
	.top h1 {
		margin: 0 0 16px;
		font-size: 2.8rem;
	}
	.top .btn {
		margin-bottom: 16px;
	}
	.etiqueta {
		font-family: var(--font-display);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-size: 0.85rem;
		color: var(--muted);
	}

	.resume {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 14px 16px;
		margin-bottom: 12px;
		border-radius: var(--radius);
		background: var(--energy-soft);
		border: 1px solid var(--energy);
		color: var(--text);
		text-decoration: none;
	}
	.resume > span:nth-child(2) {
		flex: 1;
		display: flex;
		flex-direction: column;
	}
	.resume b {
		color: var(--energy);
	}
	.pulso {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: var(--energy);
		animation: pulso 1.4s infinite;
	}
	@keyframes pulso {
		0% {
			box-shadow: 0 0 0 0 rgb(255 106 43 / 0.6);
		}
		100% {
			box-shadow: 0 0 0 12px rgb(255 106 43 / 0);
		}
	}

	.racha {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		color: var(--energy);
		font-weight: 700;
		font-size: 0.85rem;
	}
	.dias {
		list-style: none;
		padding: 0;
		margin: 14px 0 0;
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		text-align: center;
	}
	.dias li {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
	}
	.punto {
		width: 34px;
		height: 34px;
		border-radius: 50%;
		display: grid;
		place-items: center;
		background: var(--surface-2);
		border: 2px solid transparent;
	}
	.hecho .punto {
		background: var(--accent);
		color: var(--accent-ink);
	}
	.hoy .punto {
		border-color: var(--accent);
	}
	.futuro .punto {
		opacity: 0.45;
	}
	.letra {
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--muted);
	}
	.hoy .letra {
		color: var(--text);
	}

	.hero {
		position: relative;
		display: block;
		overflow: hidden;
		padding: 20px 18px 18px;
		margin-bottom: 12px;
		border-radius: 24px;
		color: var(--text);
		text-decoration: none;
		background:
			radial-gradient(120% 90% at 100% 0%, rgb(200 255 46 / 0.28), transparent 60%),
			radial-gradient(90% 70% at 0% 100%, rgb(255 106 43 / 0.2), transparent 60%),
			var(--surface);
		border: 1px solid rgb(200 255 46 / 0.35);
	}
	.hero .etiqueta {
		color: var(--accent);
	}
	.hero-titulo {
		font-size: 2.1rem;
		font-weight: 800;
		font-style: italic;
		line-height: 1;
		margin: 6px 0 12px;
	}
	.hero-titulo::before {
		display: none;
	}
	.meta {
		gap: 14px;
		color: var(--muted);
		font-size: 0.85rem;
		font-weight: 600;
	}
	.meta span {
		display: inline-flex;
		align-items: center;
		gap: 5px;
	}
	.miniaturas {
		display: flex;
		align-items: center;
		gap: 6px;
		margin: 16px 0;
	}
	.miniaturas :global(.mini) {
		width: 46px;
		height: 46px;
		border: 2px solid var(--bg);
	}
	.mas {
		font-family: var(--font-display);
		font-weight: 700;
		color: var(--muted);
	}
	.empezar {
		width: 100%;
		min-height: 56px;
		font-size: 1.35rem;
		border-radius: 16px;
	}

	.stats {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 10px;
	}
	.stat small {
		font-size: 1rem;
		margin-left: 2px;
		color: var(--muted);
	}

	.carrusel {
		display: flex;
		gap: 10px;
		overflow-x: auto;
		scroll-snap-type: x mandatory;
		margin: 0 -16px;
		padding: 0 16px 4px;
		scrollbar-width: none;
	}
	.mini-rutina {
		position: relative;
		flex: 0 0 72%;
		max-width: 260px;
		scroll-snap-align: start;
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: 14px;
		border-radius: var(--radius);
		background: var(--surface);
		border: 1px solid var(--border);
		color: var(--text);
		text-decoration: none;
	}
	.mini-rutina .chip {
		align-self: flex-start;
	}
	.mini-rutina b {
		font-family: var(--font-display);
		font-size: 1.3rem;
		line-height: 1.05;
		padding-right: 36px;
	}
	.play {
		position: absolute;
		right: 12px;
		bottom: 12px;
		width: 36px;
		height: 36px;
		border-radius: 50%;
		display: grid;
		place-items: center;
		background: var(--accent);
		color: var(--accent-ink);
	}
	.libre {
		margin-top: 12px;
	}

	.ultima {
		display: block;
		color: var(--text);
		text-decoration: none;
	}
	.cifras {
		margin-top: 8px;
		gap: 16px;
		color: var(--muted);
		font-size: 0.85rem;
	}
	.cifras b {
		font-family: var(--font-display);
		font-size: 1.4rem;
		color: var(--text);
	}
	.fecha {
		white-space: nowrap;
		flex: none;
	}
</style>
