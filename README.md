# Mi Entreno 💪

App para llevar tus rutinas de ejercicio en casa (y después en el gimnasio), registrar cada serie y ver tu progreso con el tiempo.

Es una **PWA**: se instala en el teléfono como una app, funciona **sin internet** y tus datos se guardan **solo en tu dispositivo**.

## Qué puedes hacer

- **Ejercicios**: más de 880 ejercicios en español con **fotos del movimiento e instrucciones paso a paso**: unos 50 básicos de la app más el catálogo completo de [free-exercise-db](https://github.com/yuhonas/free-exercise-db). Filtros por músculo, lugar (casa/gym), equipo y nivel. Puedes crear los tuyos.
- **Rutinas**: arma rutinas con series, repeticiones o tiempo y descanso. Incluye 2 rutinas de ejemplo para casa.
- **Entrenar**: botón "Ver técnica" con fotos e instrucciones en cada ejercicio; marca cada serie, anota reps y peso, temporizador de descanso automático (con pitido y vibración), cronómetro para ejercicios por tiempo y pantalla siempre encendida. Se prellena con lo que hiciste la última vez para que sepas qué superar. Si cierras la app a medio entreno, lo retomas donde lo dejaste.
- **Progreso**: registra peso y medidas (cintura, pecho, brazo, cadera, muslo) y ve las gráficas. Evolución por ejercicio (1RM estimado, peso máximo, reps o tiempo) y entrenos por semana.
- **Historial**: todos tus entrenos con duración, series, volumen y esfuerzo percibido.
- **Respaldo**: exporta e importa tus datos en JSON desde Ajustes.

## Stack

| Pieza | Tecnología |
|---|---|
| Interfaz | [SvelteKit](https://svelte.dev) (Svelte 5) en modo SPA con `adapter-static` |
| Datos | [Dexie.js](https://dexie.org) sobre IndexedDB |
| Gráficas | [Chart.js](https://www.chartjs.org) |
| Offline | Service worker propio (`src/service-worker/`) + `manifest.webmanifest` |
| Catálogo | [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (dominio público) traducido al español |

## Desarrollo

```bash
npm install
npm run dev        # servidor de desarrollo
npm run check      # verificación de tipos
npm run build      # genera el sitio estático en build/
npm run preview    # prueba el build (incluye el service worker)
```

> Para probarlo en tu teléfono durante el desarrollo: `npm run dev -- --host` y abre la IP de tu computadora desde el celular (misma red WiFi).

## Catálogo de ejercicios

- `data/free-exercise-db/exercises.json`: copia del catálogo original (fijada a un commit).
- `data/free-exercise-db/es/*.txt`: traducción al español de nombres e instrucciones. Formato:

  ```
  ## Id_Del_Ejercicio
  Nombre en español
  - Paso 1
  - Paso 2
  ```

- `npm run catalogo` valida las traducciones (mismo número de pasos que el original) y genera `static/catalogo-ejercicios.json`, que la app importa a IndexedDB la primera vez que abre (y cuando cambia la versión).
- Las fotos (~1,750, unos 100 MB) se descargan de GitHub y quedan guardadas en el teléfono para usarlas sin internet: las de tus rutinas se guardan solas, y en **Ajustes → Fotos de los ejercicios** puedes descargarlas todas.
- Los básicos sin foto en el catálogo (burpees, jumping jacks, etc.) usan ilustraciones propias en `static/ilustraciones/`, generadas con `python3 scripts/ilustraciones.py`.
- Los ejercicios básicos de la app (`src/lib/seed.ts`, `REFERENCIAS`) se enlazan con su equivalente del catálogo para tomar sus fotos e instrucciones.

## APK para Android

Cada vez que se sube código a GitHub, la acción **APK Android** (`.github/workflows/apk.yml`) empaqueta la app con [Capacitor](https://capacitorjs.com) y publica `MiEntreno.apk` en el Release **apk-latest** del repositorio.

- Para instalarlo: abre el Release desde el teléfono, descarga `MiEntreno.apk` y acepta "instalar apps de origen desconocido".
- Las actualizaciones se instalan encima sin perder datos porque siempre se firman con la misma llave (`android-firma/mientreno.keystore`). Ojo: esa llave está en el repo con contraseña conocida; sirve para uso personal, pero para publicar en Play Store crea una nueva y guárdala como secreto.
- Para compilarlo en tu compu necesitas Android Studio: `npm run build && npx cap add android && npx cap open android`.
- Desinstalar la app borra tus datos: descarga un respaldo antes.

## Publicarlo

La carpeta `build/` es un sitio estático. Puedes subirla gratis a Netlify, Vercel o Cloudflare Pages (comando de build `npm run build`, carpeta de salida `build`). Todas las rutas deben caer en `index.html` (ya viene configurado como *fallback*).

## Estructura

```
src/
  lib/
    db.ts          # modelo de datos (Dexie) + respaldo
    seed.ts        # ejercicios y rutinas iniciales
    catalogo.svelte.ts  # importa el catálogo de ejercicios
    sesion.ts      # lógica del entreno en curso
    util.ts        # formatos, rachas, 1RM, temporizador
    components/    # Grafica, SelectorEjercicio, DetalleEjercicio, ImagenesEjercicio
  routes/
    +page.svelte           # inicio
    rutinas/               # lista y editor
    entrenar/              # sesión de entrenamiento
    ejercicios/ progreso/ historial/ ajustes/
  service-worker/          # caché para uso sin internet (app + fotos vistas)
data/free-exercise-db/     # catálogo original + traducciones
scripts/generar-catalogo.mjs
```

## Créditos

Ejercicios, imágenes e instrucciones originales: [free-exercise-db](https://github.com/yuhonas/free-exercise-db) de yuhonas, publicado como dominio público (Unlicense). Las imágenes provienen a su vez del proyecto [exercises.json](https://github.com/wrkout/exercises.json); si algún día publicas la app en tiendas, conviene revisar su procedencia.

## Próximos pasos (ideas)

- Sincronizar entre dispositivos con PocketBase o una base local-first.
- Modo gimnasio: plantillas push/pull/legs y cálculo de discos.
- Empaquetar con Capacitor para Play Store / App Store.
- Fotos de progreso.
