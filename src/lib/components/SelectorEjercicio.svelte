<script lang="ts">
	import { liveQuery } from 'dexie';
	import { db, type Ejercicio, type Lugar } from '#lib/db.ts';
	import { MUSCULOS } from '#lib/seed.ts';
	import { normalizar } from '#lib/util.ts';
	import ImagenesEjercicio from './ImagenesEjercicio.svelte';

	interface Props {
		onelegir: (e: Ejercicio) => void;
		/** Filtra por lugar al inicio (el usuario puede cambiarlo) */
		lugar?: Lugar;
	}

	let { onelegir, lugar = 'ambos' }: Props = $props();

	const ejercicios = liveQuery(() => db.ejercicios.toArray());

	let busqueda = $state('');
	let musculo = $state('');
	// svelte-ignore state_referenced_locally
	let soloCasa = $state(lugar === 'casa');
	let limite = $state(20);

	const orden = (e: Ejercicio) => (e.fuente === 'propio' ? 0 : e.fuente === 'app' ? 1 : 2);

	const resultados = $derived.by(() => {
		const q = normalizar(busqueda.trim());
		return ($ejercicios ?? [])
			.filter(
				(e) =>
					(!q || normalizar(e.nombre).includes(q)) &&
					(!musculo || e.musculo === musculo) &&
					(!soloCasa || e.lugar !== 'gym')
			)
			.sort((a, b) => orden(a) - orden(b) || a.nombre.localeCompare(b.nombre, 'es'));
	});

	$effect(() => {
		// Al cambiar los filtros, vuelve a mostrar solo los primeros.
		void busqueda, musculo, soloCasa;
		limite = 20;
	});
</script>

<div class="selector stack">
	<input type="search" placeholder="Buscar ejercicio…" bind:value={busqueda} />
	<div class="row">
		<select bind:value={musculo}>
			<option value="">Todos los músculos</option>
			{#each MUSCULOS as m (m)}<option>{m}</option>{/each}
		</select>
		<label class="toggle"><input type="checkbox" bind:checked={soloCasa} /> Para casa</label>
	</div>
	<p class="muted">{resultados.length} ejercicios</p>
	<ul>
		{#each resultados.slice(0, limite) as e (e.id)}
			<li>
				<button class="ghost item" onclick={() => onelegir(e)}>
					<ImagenesEjercicio imagenes={e.imagenes} nombre={e.nombre} tamano="mini" />
					<span class="txt">
						<b>{e.nombre}</b>
						<span class="muted">{e.musculo} · {e.equipo}{e.nivel ? ` · ${e.nivel}` : ''}</span>
					</span>
					<span class="mas" aria-hidden="true">＋</span>
				</button>
			</li>
		{/each}
	</ul>
	{#if resultados.length > limite}
		<button class="small block" onclick={() => (limite += 20)}>Mostrar más</button>
	{/if}
</div>

<style>
	.row select {
		flex: 1;
		min-width: 0;
	}
	.toggle {
		display: flex;
		align-items: center;
		gap: 6px;
		color: var(--text);
		white-space: nowrap;
	}
	.toggle input {
		width: auto;
		min-height: 0;
		margin: 0;
	}
	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 4px;
		max-height: 420px;
		overflow-y: auto;
	}
	.item {
		width: 100%;
		justify-content: flex-start;
		text-align: left;
		padding: 6px;
		gap: 10px;
	}
	.txt {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-width: 0;
	}
	.txt .muted {
		font-size: 0.8rem;
	}
	.mas {
		color: var(--accent);
		font-size: 1.3rem;
	}
	p {
		margin: 0;
	}
</style>
