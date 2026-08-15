const CACHE_NAME = "safe-insight-laser-target-v1";

const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.json",
  "./service-worker.js",
  "./Logo High Res.png",
  "./Logo Sharp 260x260 png.png",
  "./SI Logo Border.png",
  "./pistol-shot.mp3",
  "./shot-beep.mp3"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const requestURL = new URL(event.request.url);

  if (requestURL.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) return cachedResponse;

        return fetch(event.request)
          .then(response => {
            if (!response || response.status !== 200 || response.type !== "basic") {
              return response;
            }

            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });

            return response;
          })
          .catch(() => {
            if (event.request.mode === "navigate") {
              return caches.match("./index.html");
            }

            return new Response("Offline", {
              status: 503,
              statusText: "Offline"
            });
          });
      })
  );
});
