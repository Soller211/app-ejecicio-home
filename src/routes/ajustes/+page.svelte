<script lang="ts">
	import { borrarTodo, exportarDatos, importarDatos, type Respaldo } from '#lib/db.ts';
	import { guardarEnCurso } from '#lib/sesion.ts';
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
			mensaje = 'Datos restaurados ✅';
		} catch (e) {
			mensaje = `No se pudo importar: ${(e as Error).message}`;
		}
	}

	async function reiniciar() {
		if (!confirm('¿Borrar TODO (rutinas, historial, medidas)? No se puede deshacer.')) return;
		guardarEnCurso(null);
		await borrarTodo();
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
