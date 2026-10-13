# Mi Entreno 💪

App para llevar tus rutinas de ejercicio en casa (y después en el gimnasio), registrar cada serie y ver tu progreso con el tiempo.

Es una **PWA**: se instala en el teléfono como una app, funciona **sin internet** y tus datos se guardan **solo en tu dispositivo**.

## Qué puedes hacer

- **Ejercicios**: biblioteca de ~50 ejercicios (casa sin equipo, con mancuernas/bandas y de gimnasio) con filtros por músculo y lugar. Puedes crear los tuyos.
- **Rutinas**: arma rutinas con series, repeticiones o tiempo y descanso. Incluye 2 rutinas de ejemplo para casa.
- **Entrenar**: marca cada serie, anota reps y peso, temporizador de descanso automático (con pitido y vibración), cronómetro para ejercicios por tiempo y pantalla siempre encendida. Se prellena con lo que hiciste la última vez para que sepas qué superar. Si cierras la app a medio entreno, lo retomas donde lo dejaste.
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

## Desarrollo

```bash
npm install
npm run dev        # servidor de desarrollo
npm run check      # verificación de tipos
npm run build      # genera el sitio estático en build/
npm run preview    # prueba el build (incluye el service worker)
```

> Para probarlo en tu teléfono durante el desarrollo: `npm run dev -- --host` y abre la IP de tu computadora desde el celular (misma red WiFi).

## Publicarlo

La carpeta `build/` es un sitio estático. Puedes subirla gratis a Netlify, Vercel o Cloudflare Pages (comando de build `npm run build`, carpeta de salida `build`). Todas las rutas deben caer en `index.html` (ya viene configurado como *fallback*).

## Estructura

```
src/
  lib/
    db.ts          # modelo de datos (Dexie) + respaldo
    seed.ts        # ejercicios y rutinas iniciales
    sesion.ts      # lógica del entreno en curso
    util.ts        # formatos, rachas, 1RM, temporizador
    components/Grafica.svelte
  routes/
    +page.svelte           # inicio
    rutinas/               # lista y editor
    entrenar/              # sesión de entrenamiento
    ejercicios/ progreso/ historial/ ajustes/
  service-worker/          # caché para uso sin internet
```

## Próximos pasos (ideas)

- Sincronizar entre dispositivos con PocketBase o una base local-first.
- Modo gimnasio: plantillas push/pull/legs y cálculo de discos.
- Empaquetar con Capacitor para Play Store / App Store.
- Fotos de progreso.
