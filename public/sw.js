const CACHE_NAME = "show-controller-v2";

const PRECACHE_URLS = ["./", "./index.html", "./manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  // For navigation requests (HTML pages), try network first then cache
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() =>
          caches
            .match(event.request)
            .then((cached) => cached || caches.match("./")),
        ),
    );
    return;
  }

  // For all other assets (JS, CSS, images): cache-first, then network
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        // Return cache immediately, update in background
        fetch(event.request)
          .then((response) => {
            if (response && response.status === 200) {
              caches
                .open(CACHE_NAME)
                .then((cache) => cache.put(event.request, response));
            }
          })
          .catch(() => {});
        return cached;
      }
      // Not in cache — fetch, cache, return
      return fetch(event.request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    }),
  );
});
