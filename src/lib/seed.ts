import type { Ejercicio } from './db';

type Base = Omit<Ejercicio, 'id'>;

const e = (
	nombre: string,
	musculo: string,
	equipo: string,
	lugar: Ejercicio['lugar'],
	tipo: Ejercicio['tipo'] = 'reps',
	notas?: string
): Base => ({
	nombre,
	musculo,
	equipo,
	lugar,
	tipo,
	fuente: 'app',
	...(notas ? { notas } : {}),
	...(REFERENCIAS[nombre] ? { ref: REFERENCIAS[nombre] } : {})
});

export const MUSCULOS = [
	'Pecho',
	'Espalda',
	'Hombros',
	'Bíceps',
	'Tríceps',
	'Piernas',
	'Glúteos',
	'Core',
	'Antebrazos',
	'Cuello',
	'Cardio',
	'Cuerpo completo'
];

export const EQUIPOS = [
	'Ninguno',
	'Mancuernas',
	'Barra',
	'Kettlebell',
	'Banda elástica',
	'Barra de dominadas',
	'Silla / banco',
	'Polea',
	'Máquina',
	'Barra Z',
	'Pelota de ejercicio',
	'Balón medicinal',
	'Rodillo de espuma',
	'Otro'
];

export const NIVELES = ['principiante', 'intermedio', 'avanzado'] as const;

/**
 * Ejercicios base enlazados con su equivalente en free-exercise-db: al importar el catálogo
 * toman de ahí imágenes, instrucciones y músculos, y el duplicado del catálogo no se muestra.
 */
export const REFERENCIAS: Record<string, string> = {
	Sentadilla: 'Bodyweight_Squat',
	Zancadas: 'Bodyweight_Walking_Lunge',
	'Sentadilla búlgara': 'Split_Squat_with_Dumbbells',
	'Puente de glúteo': 'Butt_Lift_Bridge',
	'Patada de glúteo en cuadrupedia': 'Glute_Kickback',
	'Lagartijas (flexiones)': 'Pushups',
	'Lagartijas inclinadas': 'Incline_Push-Up',
	'Lagartijas declinadas': 'Decline_Push-Up',
	'Fondos en silla': 'Bench_Dips',
	'Lagartijas diamante': 'Push-Ups_-_Close_Triceps_Position',
	Superman: 'Superman',
	'Remo invertido en mesa': 'Inverted_Row',
	Plancha: 'Plank',
	'Plancha lateral': 'Side_Bridge',
	'Crunch abdominal': 'Crunches',
	'Elevación de piernas': 'Flat_Bench_Lying_Leg_Raise',
	'Bicho muerto (dead bug)': 'Dead_Bug',
	'Escaladores (mountain climbers)': 'Mountain_Climbers',
	'Saltar la cuerda': 'Rope_Jumping',
	Dominadas: 'Pullups',
	'Remo con mancuerna': 'One-Arm_Dumbbell_Row',
	'Curl de bíceps con mancuernas': 'Dumbbell_Bicep_Curl',
	'Press de hombro con mancuernas': 'Dumbbell_Shoulder_Press',
	'Elevaciones laterales': 'Side_Lateral_Raise',
	'Peso muerto rumano con mancuernas': 'Stiff-Legged_Dumbbell_Deadlift',
	'Sentadilla goblet': 'Goblet_Squat',
	'Face pull con banda': 'Face_Pull',
	'Press de banca': 'Barbell_Bench_Press_-_Medium_Grip',
	'Press inclinado con mancuernas': 'Incline_Dumbbell_Press',
	'Sentadilla con barra': 'Barbell_Squat',
	'Peso muerto': 'Barbell_Deadlift',
	'Press militar con barra': 'Standing_Military_Press',
	'Jalón al pecho': 'Wide-Grip_Lat_Pulldown',
	'Remo en polea baja': 'Seated_Cable_Rows',
	'Extensión de tríceps en polea': 'Triceps_Pushdown',
	'Prensa de piernas': 'Leg_Press',
	'Extensión de cuádriceps': 'Leg_Extensions',
	'Curl femoral': 'Lying_Leg_Curls',
	'Hip thrust con barra': 'Barbell_Hip_Thrust',
	Caminadora: 'Jogging_Treadmill',
	'Bicicleta estática': 'Bicycling_Stationary'
};

export const EJERCICIOS_BASE: Base[] = [
	// Casa, sin equipo
	e('Sentadilla', 'Piernas', 'Ninguno', 'ambos', 'reps', 'Pies al ancho de hombros, espalda recta, baja hasta que los muslos queden paralelos.'),
	e('Zancadas', 'Piernas', 'Ninguno', 'ambos', 'reps', 'Reps por pierna. Rodilla delantera alineada con el pie.'),
	e('Sentadilla búlgara', 'Piernas', 'Silla / banco', 'ambos', 'reps', 'Pie trasero apoyado en silla. Reps por pierna.'),
	e('Sentadilla isométrica en pared', 'Piernas', 'Ninguno', 'casa', 'tiempo'),
	e('Elevación de talones', 'Piernas', 'Ninguno', 'ambos'),
	e('Puente de glúteo', 'Glúteos', 'Ninguno', 'ambos', 'reps', 'Aprieta glúteos arriba 1-2 segundos.'),
	e('Patada de glúteo en cuadrupedia', 'Glúteos', 'Ninguno', 'casa'),
	e('Lagartijas (flexiones)', 'Pecho', 'Ninguno', 'ambos', 'reps', 'Si cuesta, apoya rodillas o manos en una superficie elevada.'),
	e('Lagartijas inclinadas', 'Pecho', 'Silla / banco', 'casa', 'reps', 'Manos en silla o mesa: versión más fácil.'),
	e('Lagartijas declinadas', 'Pecho', 'Silla / banco', 'casa', 'reps', 'Pies elevados: versión más difícil.'),
	e('Fondos en silla', 'Tríceps', 'Silla / banco', 'casa'),
	e('Lagartijas diamante', 'Tríceps', 'Ninguno', 'ambos'),
	e('Pike push-ups', 'Hombros', 'Ninguno', 'casa', 'reps', 'Cadera alta en forma de V; trabaja hombros.'),
	e('Superman', 'Espalda', 'Ninguno', 'casa'),
	e('Remo invertido en mesa', 'Espalda', 'Silla / banco', 'casa', 'reps', 'Acostado bajo una mesa firme, jala el pecho hacia el borde.'),
	e('Plancha', 'Core', 'Ninguno', 'ambos', 'tiempo'),
	e('Plancha lateral', 'Core', 'Ninguno', 'ambos', 'tiempo'),
	e('Crunch abdominal', 'Core', 'Ninguno', 'ambos'),
	e('Elevación de piernas', 'Core', 'Ninguno', 'ambos'),
	e('Bicho muerto (dead bug)', 'Core', 'Ninguno', 'ambos'),
	e('Escaladores (mountain climbers)', 'Cardio', 'Ninguno', 'casa', 'tiempo'),
	e('Jumping jacks', 'Cardio', 'Ninguno', 'casa', 'tiempo'),
	e('Burpees', 'Cuerpo completo', 'Ninguno', 'ambos', 'tiempo'),
	e('Rodillas al pecho', 'Cardio', 'Ninguno', 'casa', 'tiempo'),
	e('Saltar la cuerda', 'Cardio', 'Ninguno', 'ambos', 'tiempo'),

	// Casa con equipo básico
	e('Dominadas', 'Espalda', 'Barra de dominadas', 'ambos'),
	e('Remo con mancuerna', 'Espalda', 'Mancuernas', 'ambos', 'reps', 'Reps por brazo.'),
	e('Curl de bíceps con mancuernas', 'Bíceps', 'Mancuernas', 'ambos'),
	e('Press de hombro con mancuernas', 'Hombros', 'Mancuernas', 'ambos'),
	e('Elevaciones laterales', 'Hombros', 'Mancuernas', 'ambos'),
	e('Peso muerto rumano con mancuernas', 'Piernas', 'Mancuernas', 'ambos'),
	e('Sentadilla goblet', 'Piernas', 'Kettlebell', 'ambos'),
	e('Swing con kettlebell', 'Cuerpo completo', 'Kettlebell', 'ambos'),
	e('Remo con banda elástica', 'Espalda', 'Banda elástica', 'casa'),
	e('Face pull con banda', 'Hombros', 'Banda elástica', 'casa'),

	// Gimnasio
	e('Press de banca', 'Pecho', 'Barra', 'gym'),
	e('Press inclinado con mancuernas', 'Pecho', 'Mancuernas', 'gym'),
	e('Sentadilla con barra', 'Piernas', 'Barra', 'gym'),
	e('Peso muerto', 'Espalda', 'Barra', 'gym'),
	e('Press militar con barra', 'Hombros', 'Barra', 'gym'),
	e('Jalón al pecho', 'Espalda', 'Polea', 'gym'),
	e('Remo en polea baja', 'Espalda', 'Polea', 'gym'),
	e('Extensión de tríceps en polea', 'Tríceps', 'Polea', 'gym'),
	e('Prensa de piernas', 'Piernas', 'Máquina', 'gym'),
	e('Extensión de cuádriceps', 'Piernas', 'Máquina', 'gym'),
	e('Curl femoral', 'Piernas', 'Máquina', 'gym'),
	e('Hip thrust con barra', 'Glúteos', 'Barra', 'gym'),
	e('Caminadora', 'Cardio', 'Máquina', 'gym', 'tiempo'),
	e('Bicicleta estática', 'Cardio', 'Máquina', 'gym', 'tiempo')
];
