import { db, type Ejercicio } from "./db";
import {
  ILUSTRACIONES,
  INSTRUCCIONES_PROPIAS,
  REFERENCIAS,
  VERSION_BASICOS,
} from "./seed";

/** Ejercicio tal como viene en static/catalogo-ejercicios.json */
type DelCatalogo = Required<
  Pick<
    Ejercicio,
    | "externoId"
    | "nombre"
    | "musculo"
    | "musculos"
    | "secundarios"
    | "equipo"
    | "lugar"
    | "tipo"
    | "nivel"
    | "categoria"
    | "imagenes"
    | "instrucciones"
  >
>;

interface Catalogo {
  version: string;
  imagenesBase: string;
  ejercicios: DelCatalogo[];
}

export const catalogo = $state({
  estado: "listo" as "listo" | "cargando" | "error",
  imagenesBase: "",
});

const URL_CATALOGO = "/catalogo-ejercicios.json";

/** URL completa de una imagen: rutas con "/" son ilustraciones propias; el resto, fotos del catálogo. */
export const urlImagen = (ruta: string) =>
  ruta.startsWith("/") ? ruta : catalogo.imagenesBase + ruta;

/**
 * Importa (o actualiza) los ~870 ejercicios de free-exercise-db en IndexedDB.
 * Solo trabaja cuando cambia la versión del catálogo; es seguro llamarla en cada arranque.
 */
export async function asegurarCatalogo() {
  try {
    const guardada = await db.meta.get("catalogo");
    const base = await db.meta.get("imagenesBase");
    if (base) catalogo.imagenesBase = base.valor;

    catalogo.estado = guardada ? "listo" : "cargando";
    const res = await fetch(URL_CATALOGO, {
      cache: guardada ? "no-cache" : "default",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const datos = (await res.json()) as Catalogo;
    catalogo.imagenesBase = datos.imagenesBase;
    const version = `${datos.version}-${VERSION_BASICOS}`;
    if (guardada?.valor === version) {
      catalogo.estado = "listo";
      return;
    }

    catalogo.estado = "cargando";
    await importar(datos, version);
    catalogo.estado = "listo";
  } catch (e) {
    console.warn("No se pudo cargar el catálogo de ejercicios", e);
    // Sin internet en el primer arranque: se intentará de nuevo la próxima vez.
    catalogo.estado = (await db.meta.get("catalogo")) ? "listo" : "error";
  }
}

async function importar(datos: Catalogo, version: string) {
  const porId = new Map(datos.ejercicios.map((e) => [e.externoId, e]));

  await db.transaction("rw", db.ejercicios, db.meta, db.rutinas, async () => {
    const existentes = await db.ejercicios.toArray();
    const enlazados = new Set<string>();
    const actualizaciones: { key: number; changes: Partial<Ejercicio> }[] = [];

    // 1) Ejercicios base: conservan su nombre y datos, pero toman imágenes e instrucciones.
    for (const e of existentes) {
      if (e.fuente !== "app") continue;
      const id = REFERENCIAS[e.nombre] ?? e.ref;
      const c = id && porId.get(id);
      if (!c) {
        const imagenes = ILUSTRACIONES[e.nombre];
        const instrucciones = INSTRUCCIONES_PROPIAS[e.nombre];
        if (imagenes || instrucciones)
          actualizaciones.push({
            key: e.id,
            changes: { imagenes, instrucciones },
          });
        continue;
      }
      enlazados.add(c.externoId);
      actualizaciones.push({
        key: e.id,
        changes: {
          ref: c.externoId,
          externoId: c.externoId,
          imagenes: c.imagenes,
          instrucciones: c.instrucciones.length
            ? c.instrucciones
            : (INSTRUCCIONES_PROPIAS[e.nombre] ?? e.instrucciones),
          musculos: c.musculos,
          secundarios: c.secundarios,
          nivel: c.nivel,
          categoria: c.categoria,
        },
      });
    }

    // 2) Ejercicios del catálogo: se actualizan si ya existen (mismo id interno = rutinas intactas).
    const delCatalogo = new Map(
      existentes
        .filter((e) => e.fuente === "catalogo" && e.externoId)
        .map((e) => [e.externoId!, e]),
    );
    const nuevos: Omit<Ejercicio, "id">[] = [];
    for (const c of datos.ejercicios) {
      if (enlazados.has(c.externoId)) continue;
      const previo = delCatalogo.get(c.externoId);
      if (previo)
        actualizaciones.push({
          key: previo.id,
          changes: { ...c, fuente: "catalogo" },
        });
      else nuevos.push({ ...c, fuente: "catalogo" });
    }

    // Copias del catálogo que ahora representa un ejercicio base: sobran si ninguna rutina las usa.
    const enRutinas = new Set(
      (await db.rutinas.toArray()).flatMap((r) =>
        r.items.map((i) => i.ejercicioId),
      ),
    );
    const sobran = existentes
      .filter(
        (e) =>
          e.fuente === "catalogo" && e.externoId && enlazados.has(e.externoId),
      )
      .filter((e) => !enRutinas.has(e.id))
      .map((e) => e.id);

    await db.ejercicios.bulkDelete(sobran);
    await db.ejercicios.bulkUpdate(actualizaciones);
    await db.ejercicios.bulkAdd(nuevos as Ejercicio[]);
    await db.meta.bulkPut([
      { clave: "catalogo", valor: version },
      { clave: "imagenesBase", valor: datos.imagenesBase },
    ]);
  });
}
