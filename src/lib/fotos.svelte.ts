import { db } from './db';
import { catalogo, urlImagen } from './catalogo.svelte';

/** Debe coincidir con CACHE_IMAGENES en src/service-worker/index.ts */
export const CACHE_IMAGENES = 'imagenes-ejercicios-v1';
/** Tamaño promedio de una foto del catálogo, para estimar el total. */
const KB_POR_FOTO = 60;

export const fotos = $state({
	guardadas: 0,
	total: 0,
	descargando: false,
	errores: 0
});

let cancelar = false;

const disponible = () => typeof caches !== 'undefined';

/** Todas las fotos del catálogo (las ilustraciones propias ya vienen con la app). */
async function todasLasUrls() {
	const ejercicios = await db.ejercicios.toArray();
	const rutas = new Set(ejercicios.flatMap((e) => e.imagenes ?? []).filter((r) => !r.startsWith('/')));
	return [...rutas].map(urlImagen);
}

async function faltantes(urls: string[]) {
	const cache = await caches.open(CACHE_IMAGENES);
	const guardadas = new Set((await cache.keys()).map((r) => r.url));
	return { cache, pendientes: urls.filter((u) => !guardadas.has(u)), guardadas: guardadas.size };
}

export async function actualizarConteo() {
	if (!disponible() || !catalogo.imagenesBase) return;
	const urls = await todasLasUrls();
	const { pendientes } = await faltantes(urls);
	fotos.total = urls.length;
	fotos.guardadas = urls.length - pendientes.length;
}

export const megasEstimados = (n: number) => Math.round((n * KB_POR_FOTO) / 1024);

/** Descarga las fotos indicadas (o todas) a la caché del teléfono, de 6 en 6. */
async function descargar(urls: string[], { mostrarProgreso }: { mostrarProgreso: boolean }) {
	const { cache, pendientes } = await faltantes(urls);
	let i = 0;
	const trabajador = async () => {
		while (i < pendientes.length && !cancelar) {
			const url = pendientes[i++];
			try {
				const res = await fetch(url, { mode: 'cors' });
				if (!res.ok) throw new Error(String(res.status));
				await cache.put(url, res);
				if (mostrarProgreso) fotos.guardadas++;
			} catch {
				if (mostrarProgreso) fotos.errores++;
			}
		}
	};
	await Promise.all(Array.from({ length: 6 }, trabajador));
}

export async function descargarTodas() {
	if (!disponible() || fotos.descargando) return;
	cancelar = false;
	fotos.descargando = true;
	fotos.errores = 0;
	try {
		// Pide al navegador no borrar estos datos si se queda sin espacio.
		await navigator.storage?.persist?.();
		await actualizarConteo();
		await descargar(await todasLasUrls(), { mostrarProgreso: true });
	} finally {
		fotos.descargando = false;
		await actualizarConteo();
	}
}

export function cancelarDescarga() {
	cancelar = true;
}

/** En segundo plano: guarda las fotos de los ejercicios que están en tus rutinas. */
export async function guardarFotosDeRutinas() {
	if (!disponible() || !catalogo.imagenesBase || fotos.descargando) return;
	const ids = new Set((await db.rutinas.toArray()).flatMap((r) => r.items.map((i) => i.ejercicioId)));
	const ejercicios = await db.ejercicios.bulkGet([...ids]);
	const urls = ejercicios
		.flatMap((e) => e?.imagenes ?? [])
		.filter((r) => !r.startsWith('/'))
		.map(urlImagen);
	cancelar = false;
	await descargar(urls, { mostrarProgreso: false });
}
