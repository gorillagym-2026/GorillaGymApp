// public/sw.js
const CACHE_VERSION = "v3"; // ← Solo cambiá este número en cada deploy
const STATIC_CACHE = `gorilla-gym-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `gorilla-gym-dynamic-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  "/",
  "/dashboard",
  "/dashboard/routine",
  "/dashboard/exercises",
  "/login",
  "/favicon.ico",
];

self.addEventListener("install", (event) => {
  console.log("[SW] Instalando versión:", CACHE_VERSION);
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
  self.skipWaiting(); // ← Activar inmediatamente sin esperar confirmación
});

self.addEventListener("activate", (event) => {
  console.log("[SW] Activando versión:", CACHE_VERSION);
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map((key) => {
            console.log("[SW] Eliminando cache viejo:", key);
            return caches.delete(key);
          }),
      ),
    ),
  );
  self.clients.claim(); // ← Tomar control de todas las tabs abiertas
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
  if (event.data === "CLEAR_CACHE") {
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .then(() => {
        event.ports[0]?.postMessage("CACHE_CLEARED");
      });
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") return;

  if (
    !url.origin.includes(self.location.origin) &&
    !url.origin.includes("supabase.co")
  ) {
    return;
  }

  // API y admin siempre van a la red
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/admin")) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (!response || response.status !== 200 || response.type === "error") {
          return response;
        }
        // Solo cachear imágenes estáticas
        if (url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/)) {
          caches
            .open(DYNAMIC_CACHE)
            .then((cache) => cache.put(request, response.clone()));
        }
        return response;
      })
      .catch(() => {
        // Solo usar cache como fallback offline
        return caches
          .match(request)
          .then((cached) => cached || caches.match("/dashboard"));
      }),
  );
});
