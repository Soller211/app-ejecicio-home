<script lang="ts">
	import { liveQuery } from 'dexie';
	import { db } from '#lib/db.ts';
	import { fechaCorta, minutosSesion, seriesHechas, volumenSesion } from '#lib/util.ts';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import NotebookPen from '@lucide/svelte/icons/notebook-pen';

	const sesiones = liveQuery(() => db.sesiones.orderBy('inicio').reverse().toArray());
	let abierta = $state<number | null>(null);
</script>

<h1>Historial</h1>

{#each $sesiones ?? [] as s (s.id)}
	{@const vol = volumenSesion(s)}
	<div class="card">
		<button class="ghost head" onclick={() => (abierta = abierta === s.id ? null : s.id)} aria-expanded={abierta === s.id}>
			<span class="fecha">{fechaCorta(s.inicio)}</span>
			<span class="titulo">{s.rutinaNombre}</span>
			<span class="nums">
				<span><b>{minutosSesion(s)}</b> min</span>
				<span><b>{seriesHechas(s)}</b> series</span>
				{#if vol}<span><b>{Math.round(vol)}</b> kg</span>{/if}
				{#if s.esfuerzo}<span><b>{s.esfuerzo}</b>/10 RPE</span>{/if}
			</span>
			<span class="chev" class:abierta={abierta === s.id}><ChevronDown size={20} /></span>
		</button>
		{#if abierta === s.id}
			<div class="detalle">
				{#each s.ejercicios as e, i (i)}
					<div class="ej">
						<b>{e.nombre}</b>
						<span class="muted">
							{e.series
								.map((x) =>
									e.tipo === 'tiempo' ? `${x.segundos}s` : `${x.reps}${x.peso ? `×${x.peso}kg` : ''}`
								)
								.join(' · ')}
						</span>
					</div>
				{/each}
				{#if s.notas}<p class="notas"><NotebookPen size={15} /> {s.notas}</p>{/if}
				<button
					class="small ghost danger"
					onclick={() => confirm('¿Borrar este entreno del historial?') && db.sesiones.delete(s.id)}
				>
					<Trash2 size={16} /> Borrar entreno
				</button>
			</div>
		{/if}
	</div>
{:else}
	{#if $sesiones}
		<p class="empty">Aún no hay entrenos guardados. <a href="/">¡Empieza uno!</a></p>
	{/if}
{/each}

<style>
	.head {
		position: relative;
		width: 100%;
		display: grid;
		justify-content: stretch;
		justify-items: start;
		text-align: left;
		padding: 0 28px 0 0;
		min-height: 0;
		gap: 2px;
	}
	.fecha {
		font-size: 0.72rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--accent);
	}
	.titulo {
		font-family: var(--font-display);
		font-size: 1.35rem;
		font-weight: 700;
		line-height: 1.1;
	}
	.nums {
		display: flex;
		flex-wrap: wrap;
		gap: 14px;
		font-size: 0.78rem;
		font-weight: 500;
		color: var(--muted);
	}
	.nums b {
		font-family: var(--font-display);
		font-size: 1.15rem;
		color: var(--text);
	}
	.chev {
		position: absolute;
		right: 0;
		top: 50%;
		translate: 0 -50%;
		color: var(--muted);
		transition: rotate 0.2s;
	}
	.chev.abierta {
		rotate: 180deg;
	}
	.detalle {
		margin-top: 12px;
		border-top: 1px solid var(--border);
		padding-top: 12px;
	}
	.ej {
		display: flex;
		flex-direction: column;
		margin-bottom: 10px;
	}
	.notas {
		display: flex;
		gap: 6px;
		align-items: flex-start;
		font-size: 0.9rem;
	}
</style>
