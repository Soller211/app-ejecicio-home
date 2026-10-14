/// <reference types="@sveltejs/kit" />
import { immutable, assets } from "$app/manifest";
import { version } from "$app/env";
import { self } from "$app/service-worker";

// Guarda en caché la app completa para que funcione sin internet (en el gym sin señal).
const CACHE = `cache-${version}`;
// Fotos de los ejercicios (free-exercise-db): se guardan conforme las ves y sobreviven a las actualizaciones.
const CACHE_IMAGENES = "imagenes-ejercicios-v1";
const ORIGEN_IMAGENES = "https://raw.githubusercontent.com";
const ASSETS = [
  "/",
  ...immutable.map((f) => f.path),
  ...assets.map((f) => f.path),
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE && k !== CACHE_IMAGENES)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (
    url.origin === ORIGEN_IMAGENES &&
    url.pathname.startsWith("/yuhonas/free-exercise-db/")
  ) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_IMAGENES);
        const hit = await cache.match(req);
        if (hit) return hit;
        try {
          const res = await fetch(req);
          // Las <img> piden con CORS (crossorigin), así la caché no infla la cuota con respuestas opacas.
          if (res.ok) cache.put(req, res.clone());
          return res;
        } catch {
          return Response.error();
        }
      })(),
    );
    return;
  }

  if (url.origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      // Navegación: es una SPA, cualquier ruta se sirve con el shell "/".
      if (req.mode === "navigate") {
        try {
          const res = await fetch(req);
          if (res.ok) cache.put("/", res.clone());
          return res;
        } catch {
          return (await cache.match("/")) ?? Response.error();
        }
      }
      const hit = await cache.match(req);
      if (hit) return hit;
      try {
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      } catch {
        return Response.error();
      }
    })(),
  );
});
