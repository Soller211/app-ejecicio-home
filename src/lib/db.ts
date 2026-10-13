import Dexie, { type EntityTable } from 'dexie';
import { EJERCICIOS_BASE } from './seed';

export type Lugar = 'casa' | 'gym' | 'ambos';
export type TipoEjercicio = 'reps' | 'tiempo';

export interface Ejercicio {
	id: number;
	nombre: string;
	musculo: string;
	equipo: string;
	tipo: TipoEjercicio;
	lugar: Lugar;
	notas?: string;
	personalizado?: boolean;
}

export interface ItemRutina {
	ejercicioId: number;
	series: number;
	/** Repeticiones objetivo (tipo reps) */
	reps?: number;
	/** Segundos objetivo (tipo tiempo) */
	segundos?: number;
	descansoSeg: number;
}

export interface Rutina {
	id: number;
	nombre: string;
	descripcion?: string;
	lugar: Lugar;
	items: ItemRutina[];
	creada: string;
}

export interface SerieRegistrada {
	reps?: number;
	peso?: number;
	segundos?: number;
	hecha: boolean;
}

export interface EjercicioSesion {
	ejercicioId: number;
	nombre: string;
	tipo: TipoEjercicio;
	descansoSeg: number;
	series: SerieRegistrada[];
}

export interface Sesion {
	id: number;
	rutinaId?: number;
	rutinaNombre: string;
	inicio: string;
	fin: string;
	notas?: string;
	/** Esfuerzo percibido 1-10 */
	esfuerzo?: number;
	ejercicios: EjercicioSesion[];
}

export interface RegistroCorporal {
	id: number;
	fecha: string; // YYYY-MM-DD
	peso?: number;
	cintura?: number;
	pecho?: number;
	brazo?: number;
	cadera?: number;
	muslo?: number;
	notas?: string;
}

export const db = new Dexie('app-ejercicio') as Dexie & {
	ejercicios: EntityTable<Ejercicio, 'id'>;
	rutinas: EntityTable<Rutina, 'id'>;
	sesiones: EntityTable<Sesion, 'id'>;
	corporal: EntityTable<RegistroCorporal, 'id'>;
};

db.version(1).stores({
	ejercicios: '++id, nombre, musculo, lugar',
	rutinas: '++id, nombre',
	sesiones: '++id, rutinaId, inicio',
	corporal: '++id, fecha'
});

db.on('populate', async (tx) => {
	await tx.table('ejercicios').bulkAdd(EJERCICIOS_BASE);
	const ids = new Map<string, number>();
	await tx
		.table('ejercicios')
		.each((e: Ejercicio) => ids.set(e.nombre, e.id));
	const item = (nombre: string, series: number, objetivo: number, descansoSeg = 60): ItemRutina => {
		const base = EJERCICIOS_BASE.find((e) => e.nombre === nombre)!;
		return {
			ejercicioId: ids.get(nombre)!,
			series,
			...(base.tipo === 'tiempo' ? { segundos: objetivo } : { reps: objetivo }),
			descansoSeg
		};
	};
	const ahora = new Date().toISOString();
	await tx.table('rutinas').bulkAdd([
		{
			nombre: 'Cuerpo completo en casa (principiante)',
			descripcion: 'Sin equipo. 2-3 veces por semana con un día de descanso entre sesiones.',
			lugar: 'casa',
			creada: ahora,
			items: [
				item('Sentadilla', 3, 15),
				item('Lagartijas (flexiones)', 3, 10),
				item('Zancadas', 3, 10),
				item('Puente de glúteo', 3, 15),
				item('Plancha', 3, 30, 45),
				item('Superman', 3, 12, 45)
			]
		},
		{
			nombre: 'Cardio HIIT en casa',
			descripcion: 'Intervalos cortos e intensos. Ideal en días alternos.',
			lugar: 'casa',
			creada: ahora,
			items: [
				item('Jumping jacks', 4, 40, 20),
				item('Burpees', 4, 30, 30),
				item('Escaladores (mountain climbers)', 4, 30, 20),
				item('Rodillas al pecho', 4, 30, 20)
			]
		}
	]);
});

/** Último registro de cada serie para un ejercicio: sirve para prellenar y progresar. */
export async function ultimasSeries(ejercicioId: number): Promise<SerieRegistrada[] | undefined> {
	const sesiones = await db.sesiones.orderBy('inicio').reverse().toArray();
	for (const s of sesiones) {
		const ej = s.ejercicios.find((e) => e.ejercicioId === ejercicioId && e.series.some((x) => x.hecha));
		if (ej) return ej.series.filter((x) => x.hecha);
	}
	return undefined;
}

export interface Respaldo {
	app: 'app-ejercicio';
	version: 1;
	exportado: string;
	ejercicios: Ejercicio[];
	rutinas: Rutina[];
	sesiones: Sesion[];
	corporal: RegistroCorporal[];
}

export async function exportarDatos(): Promise<Respaldo> {
	return {
		app: 'app-ejercicio',
		version: 1,
		exportado: new Date().toISOString(),
		ejercicios: await db.ejercicios.toArray(),
		rutinas: await db.rutinas.toArray(),
		sesiones: await db.sesiones.toArray(),
		corporal: await db.corporal.toArray()
	};
}

export async function importarDatos(datos: Respaldo) {
	if (datos?.app !== 'app-ejercicio') throw new Error('El archivo no es un respaldo de esta app.');
	await db.transaction('rw', [db.ejercicios, db.rutinas, db.sesiones, db.corporal], async () => {
		await Promise.all([db.ejercicios.clear(), db.rutinas.clear(), db.sesiones.clear(), db.corporal.clear()]);
		await db.ejercicios.bulkAdd(datos.ejercicios);
		await db.rutinas.bulkAdd(datos.rutinas);
		await db.sesiones.bulkAdd(datos.sesiones);
		await db.corporal.bulkAdd(datos.corporal);
	});
}

export async function borrarTodo() {
	await db.delete();
	await db.open();
}
