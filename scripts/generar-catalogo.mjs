// Genera static/catalogo-ejercicios.json a partir de free-exercise-db + traducciones al español.
// Uso: npm run catalogo   (falla si alguna traducción falta o no cuadra con el original)
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BASE = 'data/free-exercise-db';
// Commit fijo del repo de origen: las imágenes se sirven desde aquí.
const COMMIT = 'f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5';
const IMAGENES_BASE = `https://raw.githubusercontent.com/yuhonas/free-exercise-db/${COMMIT}/exercises/`;

const MUSCULO = {
	abdominals: 'Abdominales',
	abductors: 'Abductores',
	adductors: 'Aductores',
	biceps: 'Bíceps',
	calves: 'Pantorrillas',
	chest: 'Pecho',
	forearms: 'Antebrazos',
	glutes: 'Glúteos',
	hamstrings: 'Isquiotibiales',
	lats: 'Dorsales',
	'lower back': 'Espalda baja',
	'middle back': 'Espalda media',
	neck: 'Cuello',
	quadriceps: 'Cuádriceps',
	shoulders: 'Hombros',
	traps: 'Trapecios',
	triceps: 'Tríceps'
};

// Grupo general (el mismo que usa la app para filtrar).
const GRUPO = {
	abdominals: 'Core',
	abductors: 'Piernas',
	adductors: 'Piernas',
	biceps: 'Bíceps',
	calves: 'Piernas',
	chest: 'Pecho',
	forearms: 'Antebrazos',
	glutes: 'Glúteos',
	hamstrings: 'Piernas',
	lats: 'Espalda',
	'lower back': 'Espalda',
	'middle back': 'Espalda',
	neck: 'Cuello',
	quadriceps: 'Piernas',
	shoulders: 'Hombros',
	traps: 'Espalda',
	triceps: 'Tríceps'
};

const EQUIPO = {
	'body only': 'Ninguno',
	bands: 'Banda elástica',
	barbell: 'Barra',
	cable: 'Polea',
	dumbbell: 'Mancuernas',
	'e-z curl bar': 'Barra Z',
	'exercise ball': 'Pelota de ejercicio',
	'foam roll': 'Rodillo de espuma',
	kettlebells: 'Kettlebell',
	machine: 'Máquina',
	'medicine ball': 'Balón medicinal',
	other: 'Otro'
};
const EQUIPO_CASA = new Set([
	'body only',
	null,
	'bands',
	'dumbbell',
	'kettlebells',
	'exercise ball',
	'foam roll',
	'medicine ball'
]);

const CATEGORIA = {
	strength: 'Fuerza',
	stretching: 'Estiramiento',
	plyometrics: 'Pliometría',
	powerlifting: 'Powerlifting',
	'olympic weightlifting': 'Halterofilia',
	strongman: 'Strongman',
	cardio: 'Cardio'
};
const SOLO_GYM = new Set(['powerlifting', 'olympic weightlifting', 'strongman']);

const NIVEL = { beginner: 'principiante', intermediate: 'intermedio', expert: 'avanzado' };

/** El origen trae algunos pasos vacíos; no se traducen. */
const pasosOriginales = (x) => x.instructions.map((s) => s.trim()).filter(Boolean);

function leerTraducciones(dir) {
	const out = new Map();
	for (const archivo of readdirSync(dir).filter((f) => f.endsWith('.txt')).sort()) {
		let actual = null;
		readFileSync(join(dir, archivo), 'utf8')
			.split('\n')
			.forEach((linea, i) => {
				const donde = `${archivo}:${i + 1}`;
				if (linea.startsWith('## ')) {
					actual = linea.slice(3).trim();
					if (out.has(actual)) throw new Error(`${donde}: id duplicado ${actual}`);
					out.set(actual, { nombre: null, pasos: [] });
				} else if (!linea.trim()) {
					// línea vacía
				} else if (!actual) {
					throw new Error(`${donde}: texto fuera de un ejercicio`);
				} else if (linea.startsWith('- ')) {
					out.get(actual).pasos.push(linea.slice(2).trim());
				} else if (out.get(actual).nombre === null) {
					out.get(actual).nombre = linea.trim();
				} else {
					throw new Error(`${donde}: línea inesperada en ${actual}`);
				}
			});
	}
	return out;
}

const originales = JSON.parse(readFileSync(join(BASE, 'exercises.json'), 'utf8'));
const es = leerTraducciones(join(BASE, 'es'));

const errores = [];
const idsOriginales = new Set(originales.map((x) => x.id));
for (const id of es.keys()) if (!idsOriginales.has(id)) errores.push(`id desconocido: ${id}`);

const ejercicios = [];
for (const x of originales) {
	const t = es.get(x.id);
	if (!t) {
		errores.push(`sin traducción: ${x.id}`);
		continue;
	}
	if (!t.nombre) errores.push(`sin nombre: ${x.id}`);
	const esperados = pasosOriginales(x).length;
	if (t.pasos.length !== esperados)
		errores.push(`${x.id}: ${t.pasos.length} pasos, el original tiene ${esperados}`);

	const principal = x.primaryMuscles[0];
	ejercicios.push({
		externoId: x.id,
		nombre: t.nombre,
		musculo: x.category === 'cardio' ? 'Cardio' : (GRUPO[principal] ?? 'Cuerpo completo'),
		musculos: x.primaryMuscles.map((m) => MUSCULO[m] ?? m),
		secundarios: x.secondaryMuscles.map((m) => MUSCULO[m] ?? m),
		equipo: x.equipment ? (EQUIPO[x.equipment] ?? 'Otro') : 'Ninguno',
		lugar: EQUIPO_CASA.has(x.equipment) && !SOLO_GYM.has(x.category) ? 'ambos' : 'gym',
		tipo: x.category === 'stretching' || x.category === 'cardio' || x.force === 'static' ? 'tiempo' : 'reps',
		nivel: NIVEL[x.level] ?? 'principiante',
		categoria: CATEGORIA[x.category] ?? x.category,
		imagenes: x.images,
		instrucciones: t.pasos
	});
}

if (errores.length) {
	console.error(errores.join('\n'));
	console.error(`\n${errores.length} errores`);
	process.exit(1);
}

ejercicios.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
const cuerpo = JSON.stringify(ejercicios);
const salida = {
	version: createHash('sha256').update(cuerpo).digest('hex').slice(0, 12),
	fuente: 'https://github.com/yuhonas/free-exercise-db (Unlicense)',
	imagenesBase: IMAGENES_BASE,
	ejercicios
};
writeFileSync('static/catalogo-ejercicios.json', JSON.stringify(salida));
console.log(`${ejercicios.length} ejercicios → static/catalogo-ejercicios.json (versión ${salida.version})`);
