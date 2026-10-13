import { db, ultimasSeries, type EjercicioSesion, type Ejercicio, type Sesion } from './db';

/** Sesión que se está entrenando ahora; se guarda en localStorage para sobrevivir recargas. */
export interface SesionEnCurso {
	rutinaId?: number;
	rutinaNombre: string;
	inicio: string;
	ejercicios: EjercicioSesion[];
}

const CLAVE = 'sesion-en-curso';

export function sesionEnCurso(): SesionEnCurso | null {
	try {
		const raw = localStorage.getItem(CLAVE);
		return raw ? (JSON.parse(raw) as SesionEnCurso) : null;
	} catch {
		return null;
	}
}

export function guardarEnCurso(s: SesionEnCurso | null) {
	try {
		if (s) localStorage.setItem(CLAVE, JSON.stringify(s));
		else localStorage.removeItem(CLAVE);
	} catch {
		/* almacenamiento no disponible */
	}
}

/** Arma el ejercicio de la sesión prellenando con lo que hiciste la última vez. */
export async function ejercicioParaSesion(
	ej: Ejercicio,
	series: number,
	objetivo: { reps?: number; segundos?: number },
	descansoSeg: number
): Promise<EjercicioSesion> {
	const previas = await ultimasSeries(ej.id);
	return {
		ejercicioId: ej.id,
		nombre: ej.nombre,
		tipo: ej.tipo,
		descansoSeg,
		series: Array.from({ length: series }, (_, i) => {
			const p = previas?.[i] ?? previas?.at(-1);
			return ej.tipo === 'tiempo'
				? { segundos: p?.segundos ?? objetivo.segundos ?? 30, hecha: false }
				: { reps: p?.reps ?? objetivo.reps ?? 10, peso: p?.peso, hecha: false };
		})
	};
}

export async function iniciarDesdeRutina(rutinaId: number): Promise<SesionEnCurso | null> {
	const rutina = await db.rutinas.get(rutinaId);
	if (!rutina) return null;
	const ejercicios: EjercicioSesion[] = [];
	for (const it of rutina.items) {
		const ej = await db.ejercicios.get(it.ejercicioId);
		if (ej) ejercicios.push(await ejercicioParaSesion(ej, it.series, it, it.descansoSeg));
	}
	return { rutinaId, rutinaNombre: rutina.nombre, inicio: new Date().toISOString(), ejercicios };
}

export function iniciarLibre(): SesionEnCurso {
	return { rutinaNombre: 'Entreno libre', inicio: new Date().toISOString(), ejercicios: [] };
}

export async function finalizar(s: SesionEnCurso, extra: { notas?: string; esfuerzo?: number }) {
	const ejercicios = s.ejercicios
		.map((e) => ({ ...e, series: e.series.filter((x) => x.hecha) }))
		.filter((e) => e.series.length);
	const sesion: Omit<Sesion, 'id'> = {
		rutinaId: s.rutinaId,
		rutinaNombre: s.rutinaNombre,
		inicio: s.inicio,
		fin: new Date().toISOString(),
		ejercicios,
		...extra
	};
	const id = await db.sesiones.add(sesion as Sesion);
	guardarEnCurso(null);
	return id;
}
