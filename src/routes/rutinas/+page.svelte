<script lang="ts">
	import { liveQuery } from 'dexie';
	import { db } from '#lib/db.ts';
	import ImagenesEjercicio from '#lib/components/ImagenesEjercicio.svelte';
	import Plus from '@lucide/svelte/icons/plus';
	import Play from '@lucide/svelte/icons/play';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Timer from '@lucide/svelte/icons/timer';
	import Dumbbell from '@lucide/svelte/icons/dumbbell';
	import MapPin from '@lucide/svelte/icons/map-pin';

	const rutinas = liveQuery(() => db.rutinas.toArray());
	const ejercicios = liveQuery(async () => new Map((await db.ejercicios.toArray()).map((e) => [e.id, e])));

	const lugar = { casa: 'Casa', gym: 'Gimnasio', ambos: 'Casa o gym' } as const;
	const minutos = (r: { items: { series: number; descansoSeg: number }[] }) =>
		Math.max(1, Math.round(r.items.reduce((n, it) => n + it.series * (40 + it.descansoSeg), 0) / 60));
</script>

<div class="spread">
	<h1>Rutinas</h1>
	<a class="btn primary" href="/rutinas/editar"><Plus size={18} strokeWidth={3} /> Nueva</a>
</div>

{#each $rutinas ?? [] as r (r.id)}
	<article class="rutina">
		<div class="spread">
			<h3>{r.nombre}</h3>
			<a class="btn ghost icon-btn" href="/rutinas/editar?id={r.id}" aria-label="Editar {r.nombre}"><Pencil size={18} /></a>
		</div>
		<div class="meta">
			<span><Dumbbell size={14} /> {r.items.length} ejercicios</span>
			<span><Timer size={14} /> ~{minutos(r)} min</span>
			<span><MapPin size={14} /> {lugar[r.lugar]}</span>
		</div>
		{#if r.descripcion}<p class="muted">{r.descripcion}</p>{/if}
		<ol>
			{#each r.items as it, i (i)}
				{@const e = $ejercicios?.get(it.ejercicioId)}
				<li>
					<ImagenesEjercicio imagenes={e?.imagenes} nombre={e?.nombre ?? ''} tamano="mini" />
					<span class="nombre">{e?.nombre ?? ($ejercicios ? 'Ejercicio eliminado' : '…')}</span>
					<span class="dosis">{it.series}×{it.segundos != null ? `${it.segundos}s` : it.reps}</span>
				</li>
			{/each}
		</ol>
		<a class="btn primary block" href="/entrenar?rutina={r.id}"><Play size={18} fill="currentColor" /> Empezar</a>
	</article>
{:else}
	{#if $rutinas}
		<div class="empty">
			<p>No tienes rutinas todavía.</p>
			<a class="btn primary" href="/rutinas/editar"><Plus size={18} /> Crear rutina</a>
		</div>
	{/if}
{/each}

<style>
	.rutina {
		background: linear-gradient(160deg, var(--surface-2), var(--surface) 60%);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 16px;
		margin-bottom: 14px;
	}
	.rutina h3 {
		font-size: 1.5rem;
		font-style: italic;
		text-transform: uppercase;
		margin: 0;
	}
	.meta {
		display: flex;
		flex-wrap: wrap;
		gap: 14px;
		margin: 4px 0 8px;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--muted);
	}
	.meta span {
		display: inline-flex;
		align-items: center;
		gap: 4px;
	}
	ol {
		list-style: none;
		margin: 10px 0 14px;
		padding: 0;
		display: grid;
		gap: 8px;
	}
	li {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.nombre {
		flex: 1;
		min-width: 0;
		font-weight: 500;
	}
	.dosis {
		font-family: var(--font-display);
		font-weight: 700;
		font-size: 1.1rem;
		color: var(--accent);
		white-space: nowrap;
	}
</style>
