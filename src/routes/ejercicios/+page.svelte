<script lang="ts">
	import { liveQuery } from 'dexie';
	import { db, type Ejercicio, type Lugar, type TipoEjercicio } from '#lib/db.ts';
	import { EQUIPOS, MUSCULOS } from '#lib/seed.ts';

	const ejercicios = liveQuery(() => db.ejercicios.orderBy('nombre').toArray());

	let busqueda = $state('');
	let musculo = $state('');
	let lugar = $state<'' | Lugar>('');
	let abierto = $state<number | null>(null);

	const normal = (t: string) => t.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
	const lista = $derived(
		($ejercicios ?? []).filter(
			(e) =>
				(!busqueda || normal(e.nombre).includes(normal(busqueda))) &&
				(!musculo || e.musculo === musculo) &&
				(!lugar || e.lugar === lugar || e.lugar === 'ambos')
		)
	);

	// Formulario de nuevo ejercicio
	let creando = $state(false);
	let nuevo = $state({
		nombre: '',
		musculo: MUSCULOS[0],
		equipo: EQUIPOS[0],
		tipo: 'reps' as TipoEjercicio,
		lugar: 'casa' as Lugar,
		notas: ''
	});

	async function crear() {
		if (!nuevo.nombre.trim()) return;
		await db.ejercicios.add({
			...$state.snapshot(nuevo),
			nombre: nuevo.nombre.trim(),
			notas: nuevo.notas.trim() || undefined,
			personalizado: true
		} as Ejercicio);
		nuevo.nombre = '';
		nuevo.notas = '';
		creando = false;
	}

	async function eliminar(e: Ejercicio) {
		const usado = (await db.rutinas.toArray()).some((r) => r.items.some((i) => i.ejercicioId === e.id));
		if (usado) return alert('Este ejercicio está en una rutina. Quítalo de la rutina primero.');
		if (confirm(`¿Eliminar "${e.nombre}"?`)) await db.ejercicios.delete(e.id);
	}

	const lugarTxt = { casa: 'Casa', gym: 'Gym', ambos: 'Casa/Gym' } as const;
</script>

<div class="spread">
	<h1>Ejercicios</h1>
	<button class="primary" onclick={() => (creando = !creando)}>{creando ? 'Cerrar' : '+ Nuevo'}</button>
</div>

{#if creando}
	<div class="card stack">
		<label>Nombre <input bind:value={nuevo.nombre} placeholder="Ej. Remo con mochila" /></label>
		<div class="grid">
			<label>Músculo
				<select bind:value={nuevo.musculo}>{#each MUSCULOS as m (m)}<option>{m}</option>{/each}</select>
			</label>
			<label>Equipo
				<select bind:value={nuevo.equipo}>{#each EQUIPOS as m (m)}<option>{m}</option>{/each}</select>
			</label>
			<label>Se mide en
				<select bind:value={nuevo.tipo}>
					<option value="reps">Repeticiones</option>
					<option value="tiempo">Tiempo</option>
				</select>
			</label>
			<label>Lugar
				<select bind:value={nuevo.lugar}>
					<option value="casa">Casa</option>
					<option value="gym">Gimnasio</option>
					<option value="ambos">Ambos</option>
				</select>
			</label>
		</div>
		<label>Notas / técnica <textarea bind:value={nuevo.notas}></textarea></label>
		<button class="primary" onclick={crear} disabled={!nuevo.nombre.trim()}>Guardar ejercicio</button>
	</div>
{/if}

<div class="filtros">
	<input type="search" placeholder="Buscar…" bind:value={busqueda} />
	<div class="row">
		<select bind:value={musculo}>
			<option value="">Todos los músculos</option>
			{#each MUSCULOS as m (m)}<option>{m}</option>{/each}
		</select>
		<select bind:value={lugar}>
			<option value="">Casa y gym</option>
			<option value="casa">Casa</option>
			<option value="gym">Gimnasio</option>
		</select>
	</div>
</div>

<p class="muted">{lista.length} ejercicios</p>

{#each lista as e (e.id)}
	<div class="card item">
		<button class="ghost head" onclick={() => (abierto = abierto === e.id ? null : e.id)}>
			<span class="nombre">{e.nombre}</span>
			<span class="row">
				<span class="chip">{e.musculo}</span>
				<span class="chip">{lugarTxt[e.lugar]}</span>
			</span>
		</button>
		{#if abierto === e.id}
			<div class="detalle">
				<p class="muted">
					Equipo: {e.equipo} · Se mide en {e.tipo === 'tiempo' ? 'segundos' : 'repeticiones'}
				</p>
				{#if e.notas}<p>{e.notas}</p>{/if}
				{#if e.personalizado}
					<button class="small ghost danger" onclick={() => eliminar(e)}>Eliminar</button>
				{/if}
			</div>
		{/if}
	</div>
{/each}

<style>
	.filtros {
		display: grid;
		gap: 8px;
		margin-bottom: 8px;
	}
	.filtros select {
		flex: 1;
		min-width: 0;
	}
	.item {
		padding: 0;
	}
	.head {
		width: 100%;
		justify-content: space-between;
		text-align: left;
		padding: 12px 14px;
		flex-wrap: wrap;
	}
	.nombre {
		font-weight: 600;
	}
	.detalle {
		padding: 0 14px 12px;
	}
	.detalle p {
		margin: 4px 0 8px;
	}
</style>
