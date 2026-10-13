<script lang="ts">
	import { borrarTodo, exportarDatos, importarDatos, type Respaldo } from '#lib/db.ts';
	import { guardarEnCurso } from '#lib/sesion.ts';
	import { onMount } from 'svelte';
	import { asegurarCatalogo, catalogo } from '#lib/catalogo.svelte.ts';
	import {
		actualizarConteo,
		cancelarDescarga,
		descargarTodas,
		fotos,
		megasEstimados
	} from '#lib/fotos.svelte.ts';

	onMount(actualizarConteo);
	$effect(() => {
		// El catálogo puede terminar de cargar después de abrir esta pantalla.
		if (catalogo.estado === 'listo' && catalogo.imagenesBase) actualizarConteo();
	});

	const faltan = $derived(Math.max(0, fotos.total - fotos.guardadas));
	import { descargar, hoyISO } from '#lib/util.ts';

	let mensaje = $state('');

	async function exportar() {
		const datos = await exportarDatos();
		descargar(`mi-entreno-respaldo-${hoyISO()}.json`, JSON.stringify(datos, null, 2));
		mensaje = 'Respaldo descargado ✅';
	}

	async function importar(ev: Event) {
		const input = ev.currentTarget as HTMLInputElement;
		const archivo = input.files?.[0];
		input.value = '';
		if (!archivo) return;
		if (!confirm('Esto reemplazará TODOS tus datos actuales por los del respaldo. ¿Continuar?')) return;
		try {
			await importarDatos(JSON.parse(await archivo.text()) as Respaldo);
			await asegurarCatalogo();
			mensaje = 'Datos restaurados ✅';
		} catch (e) {
			mensaje = `No se pudo importar: ${(e as Error).message}`;
		}
	}

	async function reiniciar() {
		if (!confirm('¿Borrar TODO (rutinas, historial, medidas)? No se puede deshacer.')) return;
		guardarEnCurso(null);
		await borrarTodo();
		await asegurarCatalogo();
		await actualizarConteo();
		mensaje = 'Datos borrados. Se restauraron los ejercicios y rutinas de ejemplo.';
	}
</script>

<h1>Ajustes</h1>

<div class="card stack">
	<h3>Tus datos</h3>
	<p class="muted">
		Todo se guarda solo en este dispositivo, sin cuenta ni internet. Descarga un respaldo de vez en
		cuando para no perder tu progreso (o para pasarlo a otro teléfono).
	</p>
	<button class="primary block" onclick={exportar}>Descargar respaldo (.json)</button>
	<label class="btn block">
		Restaurar desde respaldo
		<input type="file" accept="application/json,.json" onchange={importar} hidden />
	</label>
	{#if mensaje}<p>{mensaje}</p>{/if}
</div>

<div class="card stack">
	<h3>Fotos de los ejercicios</h3>
	<p class="muted">
		Las fotos de tus rutinas se guardan solas. Si quieres tener <b>todas</b> en el teléfono para
		consultarlas sin internet, descárgalas aquí (de preferencia con Wi-Fi).
	</p>
	{#if fotos.total}
		<div class="barra" role="progressbar" aria-valuemin="0" aria-valuemax={fotos.total} aria-valuenow={fotos.guardadas}>
			<div style="width: {(fotos.guardadas / fotos.total) * 100}%"></div>
		</div>
		<p class="muted">
			{fotos.guardadas} de {fotos.total} fotos guardadas en este teléfono
			{#if fotos.errores}· {fotos.errores} no se pudieron descargar{/if}
		</p>
		{#if fotos.descargando}
			<button class="block" onclick={cancelarDescarga}>Pausar descarga</button>
		{:else if faltan > 0}
			<button class="primary block" onclick={descargarTodas}>
				Descargar {faltan} fotos (~{megasEstimados(faltan)} MB)
			</button>
		{:else}
			<p>✅ Tienes todas las fotos guardadas.</p>
		{/if}
	{:else}
		<p class="muted">Las fotos estarán disponibles cuando termine de cargar el catálogo.</p>
	{/if}
</div>

<div class="card stack">
	<h3>Instalar en tu teléfono</h3>
	<p class="muted">
		<b>Android (Chrome):</b> menú ⋮ → “Instalar app” o “Agregar a pantalla principal”.<br />
		<b>iPhone (Safari):</b> botón Compartir → “Agregar a inicio”.
	</p>
</div>

<div class="card stack">
	<h3>Zona peligrosa</h3>
	<button class="ghost danger block" onclick={reiniciar}>Borrar todos mis datos</button>
</div>

<style>
	.barra {
		height: 8px;
		background: var(--surface-2);
		border-radius: 4px;
		overflow: hidden;
	}
	.barra div {
		height: 100%;
		background: var(--accent);
		transition: width 0.3s;
	}
	p {
		margin: 0;
	}
</style>
