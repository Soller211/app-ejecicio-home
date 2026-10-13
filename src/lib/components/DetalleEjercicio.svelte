<script lang="ts">
	import type { Ejercicio } from '#lib/db.ts';
	import ImagenesEjercicio from './ImagenesEjercicio.svelte';

	let { ejercicio: e }: { ejercicio: Ejercicio } = $props();

	const lugarTxt = { casa: 'Casa', gym: 'Gimnasio', ambos: 'Casa o gym' } as const;
</script>

<div class="detalle">
	<ImagenesEjercicio imagenes={e.imagenes} nombre={e.nombre} />

	<div class="row chips">
		{#if e.nivel}<span class="chip">Nivel {e.nivel}</span>{/if}
		{#if e.categoria}<span class="chip">{e.categoria}</span>{/if}
		<span class="chip">{e.equipo}</span>
		<span class="chip">{lugarTxt[e.lugar]}</span>
		<span class="chip">Se mide en {e.tipo === 'tiempo' ? 'segundos' : 'repeticiones'}</span>
	</div>

	{#if e.musculos?.length}
		<p class="muted">
			<b>Músculos:</b>
			{e.musculos.join(', ')}
			{#if e.secundarios?.length}
				<br /><b>Secundarios:</b> {e.secundarios.join(', ')}
			{/if}
		</p>
	{/if}

	{#if e.notas}<p>{e.notas}</p>{/if}

	{#if e.instrucciones?.length}
		<ol>
			{#each e.instrucciones as paso, i (i)}<li>{paso}</li>{/each}
		</ol>
	{/if}
</div>

<style>
	.detalle {
		display: grid;
		gap: 10px;
	}
	.chips {
		gap: 6px;
	}
	p {
		margin: 0;
	}
	ol {
		margin: 0;
		padding-left: 20px;
		display: grid;
		gap: 6px;
		font-size: 0.92rem;
		line-height: 1.45;
	}
</style>
