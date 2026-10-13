<script lang="ts">
	import { liveQuery } from 'dexie';
	import { db, type Ejercicio, type Lugar, type TipoEjercicio } from '#lib/db.ts';
	import { EQUIPOS, MUSCULOS, NIVELES } from '#lib/seed.ts';
	import { catalogo } from '#lib/catalogo.svelte.ts';
	import { normalizar } from '#lib/util.ts';
	import DetalleEjercicio from '#lib/components/DetalleEjercicio.svelte';
	import ImagenesEjercicio from '#lib/components/ImagenesEjercicio.svelte';

	const ejercicios = liveQuery(() => db.ejercicios.orderBy('nombre').toArray());

	let busqueda = $state('');
	let musculo = $state('');
	let lugar = $state<'' | Lugar>('');
	let equipo = $state('');
	let nivel = $state('');
	let fuente = $state<'' | 'basicos' | 'propios'>('');
	let abierto = $state<number | null>(null);
	let limite = $state(40);

	const lista = $derived.by(() => {
		const q = normalizar(busqueda.trim());
		return ($ejercicios ?? []).filter(
			(e) =>
				(!q || normalizar(e.nombre).includes(q)) &&
				(!musculo || e.musculo === musculo) &&
				(!lugar || e.lugar === lugar || e.lugar === 'ambos') &&
				(!equipo || e.equipo === equipo) &&
				(!nivel || e.nivel === nivel) &&
				(!fuente ||
					(fuente === 'basicos' && e.fuente === 'app') ||
					(fuente === 'propios' && e.fuente === 'propio'))
		);
	});

	$effect(() => {
		void busqueda, musculo, lugar, equipo, nivel, fuente;
		limite = 40;
	});

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
			personalizado: true,
			fuente: 'propio'
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

{#if catalogo.estado === 'cargando'}
	<p class="card aviso">Cargando el catálogo de ejercicios…</p>
{:else if catalogo.estado === 'error'}
	<p class="card aviso">
		No se pudo descargar el catálogo completo (¿sin internet?). Se intentará de nuevo al abrir la app.
	</p>
{/if}

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
	<div class="grid">
		<select bind:value={musculo} aria-label="Músculo">
			<option value="">Todos los músculos</option>
			{#each MUSCULOS as m (m)}<option>{m}</option>{/each}
		</select>
		<select bind:value={lugar} aria-label="Lugar">
			<option value="">Casa y gym</option>
			<option value="casa">Casa</option>
			<option value="gym">Gimnasio</option>
		</select>
		<select bind:value={equipo} aria-label="Equipo">
			<option value="">Cualquier equipo</option>
			{#each EQUIPOS as m (m)}<option>{m}</option>{/each}
		</select>
		<select bind:value={nivel} aria-label="Nivel">
			<option value="">Cualquier nivel</option>
			{#each NIVELES as n (n)}<option value={n}>{n[0].toUpperCase() + n.slice(1)}</option>{/each}
		</select>
		<select bind:value={fuente} aria-label="Origen">
			<option value="">Todos</option>
			<option value="basicos">Básicos de la app</option>
			<option value="propios">Mis ejercicios</option>
		</select>
	</div>
</div>

<p class="muted">{lista.length} ejercicios</p>

{#each lista.slice(0, limite) as e (e.id)}
	<div class="card item">
		<button class="ghost head" onclick={() => (abierto = abierto === e.id ? null : e.id)} aria-expanded={abierto === e.id}>
			<ImagenesEjercicio imagenes={e.imagenes} nombre={e.nombre} tamano="mini" />
			<span class="txt">
				<span class="nombre">{e.nombre}</span>
				<span class="row">
					<span class="chip">{e.musculo}</span>
					<span class="chip">{lugarTxt[e.lugar]}</span>
					{#if e.fuente === 'propio'}<span class="chip">Propio</span>{/if}
				</span>
			</span>
		</button>
		{#if abierto === e.id}
			<div class="cuerpo">
				<DetalleEjercicio ejercicio={e} />
				{#if e.personalizado}
					<button class="small ghost danger" onclick={() => eliminar(e)}>Eliminar</button>
				{/if}
			</div>
		{/if}
	</div>
{/each}

{#if lista.length > limite}
	<button class="block" onclick={() => (limite += 40)}>Mostrar más ({lista.length - limite} restantes)</button>
{/if}

<p class="muted creditos">
	Catálogo, imágenes e instrucciones originales:
	<a href="https://github.com/yuhonas/free-exercise-db" target="_blank" rel="noopener">free-exercise-db</a>
	(dominio público). Traducción al español incluida en esta app.
</p>

<style>
	.aviso {
		font-size: 0.9rem;
	}
	.filtros {
		display: grid;
		gap: 8px;
		margin-bottom: 8px;
	}
	.item {
		padding: 0;
	}
	.head {
		width: 100%;
		justify-content: flex-start;
		text-align: left;
		padding: 10px 12px;
		gap: 12px;
	}
	.txt {
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 0;
	}
	.nombre {
		font-weight: 600;
	}
	.cuerpo {
		padding: 0 12px 12px;
		display: grid;
		gap: 10px;
	}
	.creditos {
		margin-top: 20px;
		font-size: 0.8rem;
	}
</style>
