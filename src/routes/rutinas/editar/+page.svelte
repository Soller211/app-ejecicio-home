<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { liveQuery } from 'dexie';
	import { db, type Ejercicio, type ItemRutina, type Lugar, type Rutina } from '#lib/db.ts';
	import ImagenesEjercicio from '#lib/components/ImagenesEjercicio.svelte';
	import SelectorEjercicio from '#lib/components/SelectorEjercicio.svelte';
	import { guardarFotosDeRutinas } from '#lib/fotos.svelte.ts';

	let id = $state<number | undefined>();
	let nombre = $state('');
	let descripcion = $state('');
	let lugar = $state<Lugar>('casa');
	let items = $state<ItemRutina[]>([]);

	const ejercicios = liveQuery(() => db.ejercicios.orderBy('nombre').toArray());
	const porId = $derived(new Map(($ejercicios ?? []).map((e) => [e.id, e])));

	onMount(async () => {
		const q = Number(page.url.searchParams.get('id'));
		if (!q) return;
		const r = await db.rutinas.get(q);
		if (!r) return;
		id = r.id;
		nombre = r.nombre;
		descripcion = r.descripcion ?? '';
		lugar = r.lugar;
		items = r.items;
	});

	function agregar(e: Ejercicio) {
		items.push(
			e.tipo === 'tiempo'
				? { ejercicioId: e.id, series: 3, segundos: 30, descansoSeg: 45 }
				: { ejercicioId: e.id, series: 3, reps: 10, descansoSeg: 60 }
		);
	}

	function mover(i: number, d: number) {
		const j = i + d;
		if (j < 0 || j >= items.length) return;
		const [x] = items.splice(i, 1);
		items.splice(j, 0, x);
	}

	async function guardar() {
		if (!nombre.trim()) return alert('Ponle un nombre a la rutina.');
		if (!items.length) return alert('Agrega al menos un ejercicio.');
		const datos = {
			nombre: nombre.trim(),
			descripcion: descripcion.trim() || undefined,
			lugar,
			items: $state.snapshot(items)
		};
		if (id) await db.rutinas.update(id, datos);
		else await db.rutinas.add({ ...datos, creada: new Date().toISOString() } as Rutina);
		guardarFotosDeRutinas();
		goto('/rutinas');
	}

	async function eliminar() {
		if (!id || !confirm('¿Eliminar esta rutina? Tu historial de entrenos se conserva.')) return;
		await db.rutinas.delete(id);
		goto('/rutinas');
	}
</script>

<h1>{id ? 'Editar rutina' : 'Nueva rutina'}</h1>

<div class="card stack">
	<label>Nombre <input bind:value={nombre} placeholder="Ej. Pierna y glúteo" /></label>
	<label>Descripción <textarea bind:value={descripcion} placeholder="Opcional"></textarea></label>
	<label>
		¿Dónde la haces?
		<select bind:value={lugar}>
			<option value="casa">Casa</option>
			<option value="gym">Gimnasio</option>
			<option value="ambos">Casa o gimnasio</option>
		</select>
	</label>
</div>

<h2>Ejercicios</h2>
{#each items as it, i (i)}
	{@const e = porId.get(it.ejercicioId)}
	<div class="card">
		<div class="spread">
			<div class="row titulo">
				<ImagenesEjercicio imagenes={e?.imagenes} nombre={e?.nombre ?? ''} tamano="mini" />
				<h3>{i + 1}. {e?.nombre ?? '—'}</h3>
			</div>
			<div class="row">
				<button class="small ghost" onclick={() => mover(i, -1)} aria-label="Subir">↑</button>
				<button class="small ghost" onclick={() => mover(i, 1)} aria-label="Bajar">↓</button>
				<button class="small ghost danger" onclick={() => items.splice(i, 1)} aria-label="Quitar">✕</button>
			</div>
		</div>
		<div class="grid3">
			<label>Series <input type="number" min="1" inputmode="numeric" bind:value={it.series} /></label>
			{#if e?.tipo === 'tiempo'}
				<label>Segundos <input type="number" min="5" inputmode="numeric" bind:value={it.segundos} /></label>
			{:else}
				<label>Reps <input type="number" min="1" inputmode="numeric" bind:value={it.reps} /></label>
			{/if}
			<label>Descanso (s) <input type="number" min="0" step="15" inputmode="numeric" bind:value={it.descansoSeg} /></label>
		</div>
	</div>
{:else}
	<p class="empty">Agrega ejercicios desde abajo.</p>
{/each}

<div class="card stack">
	<h3>Agregar ejercicio</h3>
	{#key lugar}<SelectorEjercicio {lugar} onelegir={agregar} />{/key}
	<p class="muted">¿No está? <a href="/ejercicios">Crea un ejercicio propio</a>.</p>
</div>

<div class="row">
	<button class="primary" onclick={guardar}>Guardar rutina</button>
	<a class="btn" href="/rutinas">Cancelar</a>
	{#if id}<button class="ghost danger" onclick={eliminar}>Eliminar</button>{/if}
</div>

<style>
	.titulo {
		flex-wrap: nowrap;
		min-width: 0;
	}
	.titulo h3 {
		margin: 0;
	}
	.grid3 {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 8px;
		margin-top: 8px;
	}
</style>
