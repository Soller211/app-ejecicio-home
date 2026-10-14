import type { Ejercicio } from "./db";

type Base = Omit<Ejercicio, "id">;

const e = (
  nombre: string,
  musculo: string,
  equipo: string,
  lugar: Ejercicio["lugar"],
  tipo: Ejercicio["tipo"] = "reps",
  notas?: string,
): Base => ({
  nombre,
  musculo,
  equipo,
  lugar,
  tipo,
  fuente: "app",
  ...(notas ? { notas } : {}),
  ...(REFERENCIAS[nombre] ? { ref: REFERENCIAS[nombre] } : {}),
  ...(ILUSTRACIONES[nombre] ? { imagenes: ILUSTRACIONES[nombre] } : {}),
  ...(INSTRUCCIONES_PROPIAS[nombre]
    ? { instrucciones: INSTRUCCIONES_PROPIAS[nombre] }
    : {}),
});

export const MUSCULOS = [
  "Pecho",
  "Espalda",
  "Hombros",
  "Bíceps",
  "Tríceps",
  "Piernas",
  "Glúteos",
  "Core",
  "Antebrazos",
  "Cuello",
  "Cardio",
  "Cuerpo completo",
];

export const EQUIPOS = [
  "Ninguno",
  "Mancuernas",
  "Barra",
  "Kettlebell",
  "Banda elástica",
  "Barra de dominadas",
  "Silla / banco",
  "Polea",
  "Máquina",
  "Barra Z",
  "Pelota de ejercicio",
  "Balón medicinal",
  "Rodillo de espuma",
  "Otro",
];

export const NIVELES = ["principiante", "intermedio", "avanzado"] as const;

/**
 * Ejercicios base enlazados con su equivalente en free-exercise-db: al importar el catálogo
 * toman de ahí imágenes, instrucciones y músculos, y el duplicado del catálogo no se muestra.
 */
export const REFERENCIAS: Record<string, string> = {
  Sentadilla: "Bodyweight_Squat",
  Zancadas: "Bodyweight_Walking_Lunge",
  "Sentadilla búlgara": "Split_Squat_with_Dumbbells",
  "Puente de glúteo": "Butt_Lift_Bridge",
  "Patada de glúteo en cuadrupedia": "Glute_Kickback",
  "Lagartijas (flexiones)": "Pushups",
  "Lagartijas inclinadas": "Incline_Push-Up",
  "Lagartijas declinadas": "Decline_Push-Up",
  "Fondos en silla": "Bench_Dips",
  "Lagartijas diamante": "Push-Ups_-_Close_Triceps_Position",
  Superman: "Superman",
  "Remo invertido en mesa": "Inverted_Row",
  Plancha: "Plank",
  "Plancha lateral": "Side_Bridge",
  "Crunch abdominal": "Crunches",
  "Elevación de piernas": "Flat_Bench_Lying_Leg_Raise",
  "Bicho muerto (dead bug)": "Dead_Bug",
  "Escaladores (mountain climbers)": "Mountain_Climbers",
  "Saltar la cuerda": "Rope_Jumping",
  Dominadas: "Pullups",
  "Remo con mancuerna": "One-Arm_Dumbbell_Row",
  "Curl de bíceps con mancuernas": "Dumbbell_Bicep_Curl",
  "Press de hombro con mancuernas": "Dumbbell_Shoulder_Press",
  "Elevaciones laterales": "Side_Lateral_Raise",
  "Peso muerto rumano con mancuernas": "Stiff-Legged_Dumbbell_Deadlift",
  "Sentadilla goblet": "Goblet_Squat",
  "Face pull con banda": "Face_Pull",
  "Press de banca": "Barbell_Bench_Press_-_Medium_Grip",
  "Press inclinado con mancuernas": "Incline_Dumbbell_Press",
  "Sentadilla con barra": "Barbell_Squat",
  "Peso muerto": "Barbell_Deadlift",
  "Press militar con barra": "Standing_Military_Press",
  "Jalón al pecho": "Wide-Grip_Lat_Pulldown",
  "Remo en polea baja": "Seated_Cable_Rows",
  "Extensión de tríceps en polea": "Triceps_Pushdown",
  "Prensa de piernas": "Leg_Press",
  "Extensión de cuádriceps": "Leg_Extensions",
  "Curl femoral": "Lying_Leg_Curls",
  "Hip thrust con barra": "Barbell_Hip_Thrust",
  Caminadora: "Jogging_Treadmill",
  "Bicicleta estática": "Bicycling_Stationary",
  "Elevación de talones": "Standing_Dumbbell_Calf_Raise",
  "Swing con kettlebell": "One-Arm_Kettlebell_Swings",
};

/** Ilustraciones propias (static/ilustraciones, scripts/ilustraciones.py) para básicos sin foto en el catálogo. */
const ilus = (nombre: string, cuadros: number) =>
  Array.from(
    { length: cuadros },
    (_, i) => `/ilustraciones/${nombre}-${i + 1}.svg`,
  );

export const ILUSTRACIONES: Record<string, string[]> = {
  "Jumping jacks": ilus("jumping-jacks", 2),
  Burpees: ilus("burpees", 4),
  "Rodillas al pecho": ilus("rodillas-al-pecho", 2),
  "Sentadilla isométrica en pared": ilus("sentadilla-pared", 2),
  "Pike push-ups": ilus("pike-push-up", 2),
  "Remo con banda elástica": ilus("remo-banda", 2),
};

/** Instrucciones para los básicos que no tienen equivalente en el catálogo. */
export const INSTRUCCIONES_PROPIAS: Record<string, string[]> = {
  "Jumping jacks": [
    "Párate con los pies juntos y los brazos a los lados.",
    "Salta abriendo las piernas un poco más que los hombros mientras subes los brazos por los lados hasta arriba de la cabeza.",
    "Salta de nuevo para regresar a la posición inicial.",
    "Mantén un ritmo constante y cae suave sobre la parte delantera de los pies.",
  ],
  Burpees: [
    "Párate con los pies a la anchura de los hombros.",
    "Baja en cuclillas y apoya las manos en el piso frente a ti.",
    "Salta llevando los pies hacia atrás hasta quedar en plancha. Si quieres más reto, haz una lagartija.",
    "Salta trayendo los pies de regreso junto a las manos.",
    "Ponte de pie y salta con los brazos arriba. Versión más fácil: da pasos hacia atrás y adelante en lugar de saltar.",
  ],
  "Rodillas al pecho": [
    "De pie, corre en tu lugar subiendo las rodillas a la altura de la cadera.",
    "Mueve los brazos como al correr, con los codos flexionados.",
    "Cae sobre la parte delantera de los pies, con el torso erguido y el abdomen firme.",
    "Mantén el ritmo durante el tiempo indicado.",
  ],
  "Sentadilla isométrica en pared": [
    "Recarga la espalda en la pared y separa los pies unos 50 cm de ella, a la anchura de la cadera.",
    "Deslízate hacia abajo hasta que los muslos queden paralelos al piso y las rodillas justo encima de los tobillos.",
    "Mantén la posición con la espalda pegada a la pared durante el tiempo indicado. Respira normalmente.",
    "Sube deslizándote por la pared para terminar.",
  ],
  "Pike push-ups": [
    'Colócate en posición de lagartija y sube la cadera formando una "V" invertida, con las piernas lo más rectas posible.',
    "Flexiona los codos y baja la cabeza hacia el piso, entre las manos.",
    "Empuja hasta estirar los brazos.",
    "Para hacerlo más difícil, apoya los pies en una silla o escalón.",
  ],
  "Plancha lateral": [
    "Acuéstate de lado apoyado en el antebrazo, con el codo justo debajo del hombro y las piernas estiradas una sobre otra.",
    "Eleva la cadera hasta que el cuerpo forme una línea recta de la cabeza a los pies.",
    "Mantén la posición con el abdomen firme, sin dejar caer la cadera, durante el tiempo indicado.",
    "Cambia de lado. Versión más fácil: apoya la rodilla de abajo en el piso.",
  ],
  "Swing con kettlebell": [
    "Párate con los pies un poco más abiertos que los hombros y la kettlebell en el piso frente a ti.",
    "Lleva la cadera atrás con la espalda recta, toma la kettlebell con ambas manos y balancéala hacia atrás entre las piernas.",
    "Extiende la cadera con fuerza, apretando los glúteos, para que la kettlebell suba hasta la altura del pecho con los brazos estirados. El impulso sale de la cadera, no de los brazos.",
    "Deja que baje de nuevo entre las piernas llevando la cadera atrás y repite sin pausa.",
  ],
  "Remo con banda elástica": [
    "Siéntate en el piso con las piernas estiradas y pasa la banda por la planta de los pies.",
    "Toma los extremos con los brazos estirados y la espalda recta.",
    "Jala hacia el abdomen llevando los codos hacia atrás y juntando los omóplatos.",
    "Regresa despacio y con control a la posición inicial.",
  ],
};

/** Súbelo al cambiar REFERENCIAS o ILUSTRACIONES para que la app vuelva a enlazar los básicos. */
export const VERSION_BASICOS = 2;

export const EJERCICIOS_BASE: Base[] = [
  // Casa, sin equipo
  e(
    "Sentadilla",
    "Piernas",
    "Ninguno",
    "ambos",
    "reps",
    "Pies al ancho de hombros, espalda recta, baja hasta que los muslos queden paralelos.",
  ),
  e(
    "Zancadas",
    "Piernas",
    "Ninguno",
    "ambos",
    "reps",
    "Reps por pierna. Rodilla delantera alineada con el pie.",
  ),
  e(
    "Sentadilla búlgara",
    "Piernas",
    "Silla / banco",
    "ambos",
    "reps",
    "Pie trasero apoyado en silla. Reps por pierna.",
  ),
  e("Sentadilla isométrica en pared", "Piernas", "Ninguno", "casa", "tiempo"),
  e("Elevación de talones", "Piernas", "Ninguno", "ambos"),
  e(
    "Puente de glúteo",
    "Glúteos",
    "Ninguno",
    "ambos",
    "reps",
    "Aprieta glúteos arriba 1-2 segundos.",
  ),
  e("Patada de glúteo en cuadrupedia", "Glúteos", "Ninguno", "casa"),
  e(
    "Lagartijas (flexiones)",
    "Pecho",
    "Ninguno",
    "ambos",
    "reps",
    "Si cuesta, apoya rodillas o manos en una superficie elevada.",
  ),
  e(
    "Lagartijas inclinadas",
    "Pecho",
    "Silla / banco",
    "casa",
    "reps",
    "Manos en silla o mesa: versión más fácil.",
  ),
  e(
    "Lagartijas declinadas",
    "Pecho",
    "Silla / banco",
    "casa",
    "reps",
    "Pies elevados: versión más difícil.",
  ),
  e("Fondos en silla", "Tríceps", "Silla / banco", "casa"),
  e("Lagartijas diamante", "Tríceps", "Ninguno", "ambos"),
  e(
    "Pike push-ups",
    "Hombros",
    "Ninguno",
    "casa",
    "reps",
    "Cadera alta en forma de V; trabaja hombros.",
  ),
  e("Superman", "Espalda", "Ninguno", "casa"),
  e(
    "Remo invertido en mesa",
    "Espalda",
    "Silla / banco",
    "casa",
    "reps",
    "Acostado bajo una mesa firme, jala el pecho hacia el borde.",
  ),
  e("Plancha", "Core", "Ninguno", "ambos", "tiempo"),
  e("Plancha lateral", "Core", "Ninguno", "ambos", "tiempo"),
  e("Crunch abdominal", "Core", "Ninguno", "ambos"),
  e("Elevación de piernas", "Core", "Ninguno", "ambos"),
  e("Bicho muerto (dead bug)", "Core", "Ninguno", "ambos"),
  e("Escaladores (mountain climbers)", "Cardio", "Ninguno", "casa", "tiempo"),
  e("Jumping jacks", "Cardio", "Ninguno", "casa", "tiempo"),
  e("Burpees", "Cuerpo completo", "Ninguno", "ambos", "tiempo"),
  e("Rodillas al pecho", "Cardio", "Ninguno", "casa", "tiempo"),
  e("Saltar la cuerda", "Cardio", "Ninguno", "ambos", "tiempo"),

  // Casa con equipo básico
  e("Dominadas", "Espalda", "Barra de dominadas", "ambos"),
  e(
    "Remo con mancuerna",
    "Espalda",
    "Mancuernas",
    "ambos",
    "reps",
    "Reps por brazo.",
  ),
  e("Curl de bíceps con mancuernas", "Bíceps", "Mancuernas", "ambos"),
  e("Press de hombro con mancuernas", "Hombros", "Mancuernas", "ambos"),
  e("Elevaciones laterales", "Hombros", "Mancuernas", "ambos"),
  e("Peso muerto rumano con mancuernas", "Piernas", "Mancuernas", "ambos"),
  e("Sentadilla goblet", "Piernas", "Kettlebell", "ambos"),
  e("Swing con kettlebell", "Cuerpo completo", "Kettlebell", "ambos"),
  e("Remo con banda elástica", "Espalda", "Banda elástica", "casa"),
  e("Face pull con banda", "Hombros", "Banda elástica", "casa"),

  // Gimnasio
  e("Press de banca", "Pecho", "Barra", "gym"),
  e("Press inclinado con mancuernas", "Pecho", "Mancuernas", "gym"),
  e("Sentadilla con barra", "Piernas", "Barra", "gym"),
  e("Peso muerto", "Espalda", "Barra", "gym"),
  e("Press militar con barra", "Hombros", "Barra", "gym"),
  e("Jalón al pecho", "Espalda", "Polea", "gym"),
  e("Remo en polea baja", "Espalda", "Polea", "gym"),
  e("Extensión de tríceps en polea", "Tríceps", "Polea", "gym"),
  e("Prensa de piernas", "Piernas", "Máquina", "gym"),
  e("Extensión de cuádriceps", "Piernas", "Máquina", "gym"),
  e("Curl femoral", "Piernas", "Máquina", "gym"),
  e("Hip thrust con barra", "Glúteos", "Barra", "gym"),
  e("Caminadora", "Cardio", "Máquina", "gym", "tiempo"),
  e("Bicicleta estática", "Cardio", "Máquina", "gym", "tiempo"),
];
