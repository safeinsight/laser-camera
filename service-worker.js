const CACHE_NAME = "safe-insight-laser-target-wix-auth-v1.0.0";

const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.json",
  "./service-worker.js",
  "./wix-auth.js",
  "./Logo High Res.png",
  "./Logo Sharp 260x260 png.png",
  "./SI Logo Border.png",
  "./pistol-shot.mp3",
  "./shot-beep.mp3"
];

const OFFLINE_AUDIO = [
  "pistol-shot.mp3",
  "shot-beep.mp3"
];

const OFFLINE_IMAGES = [
  "Logo High Res.png"
];

function isOfflineAudioRequest(request) {
  const path = new URL(request.url).pathname.toLowerCase();
  return OFFLINE_AUDIO.some(file => path.endsWith("/" + file.toLowerCase()));
}

function isOfflineImageRequest(request) {
  const path = new URL(request.url).pathname.toLowerCase();
  return OFFLINE_IMAGES.some(file => path.endsWith("/" + file.toLowerCase()));
}

function audioCacheRequest(request) {
  // Audio elements can make Range requests. Store and retrieve the
  // complete audio file using a clean URL so those requests still work
  // offline instead of missing the cached response.
  return new Request(new URL(request.url).href, {
    method: "GET",
    credentials: "same-origin"
  });
}

function imageCacheRequest(request) {
  // PDF/image loading should always use the complete cached image.
  return new Request(new URL(request.url).href, {
    method: "GET",
    credentials: "same-origin"
  });
}

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async cache => {
        await cache.addAll(APP_SHELL);
      })
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

async function injectAuthScript(response) {
  if (!response) return response;

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) return response;

  let html = await response.text();

  if (!html.includes('src="./wix-auth.js"') && !html.includes('src="wix-auth.js"')) {
    html = html.replace(
      /<\/body>/i,
      '<script src="./wix-auth.js"></script>\n</body>'
    );
  }

  if (!html.includes('id="appVersion"')) {
    html = html.replace(
      /(<div\s+id="settingsPanel">)/i,
      `$1\n    <div id="appVersion" style="text-align:center; margin:20px 0 10px; color:#000000; font-family:system-ui,-apple-system,sans-serif; font-size:14px; line-height:1.5; opacity:0.75;">\n        <div>Safe Insight Laser Target</div>\n        <div>Version 1.0.0</div>\n    </div>`
    );
  }

  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  });
}

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const requestURL = new URL(event.request.url);
  if (requestURL.origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      // Handle audio separately because browsers may request audio with
      // Range headers. Always use the clean URL as the cache key.
      if (isOfflineAudioRequest(event.request)) {
        const cacheRequest = audioCacheRequest(event.request);
        const cache = await caches.open(CACHE_NAME);
        const cachedAudio = await cache.match(cacheRequest);

        if (cachedAudio) {
          return cachedAudio;
        }

        try {
          const response = await fetch(cacheRequest);

          if (response && response.ok) {
            await cache.put(cacheRequest, response.clone());
          }

          return response;
        } catch (error) {
          return new Response("Offline audio unavailable", {
            status: 503,
            statusText: "Offline"
          });
        }
      }

      // Handle the PDF logo separately so jsPDF can always retrieve the
      // complete image from the service-worker cache while offline.
      if (isOfflineImageRequest(event.request)) {
        const cacheRequest = imageCacheRequest(event.request);
        const cache = await caches.open(CACHE_NAME);
        const cachedImage = await cache.match(cacheRequest);

        if (cachedImage) {
          return cachedImage;
        }

        try {
          const response = await fetch(cacheRequest);

          if (response && response.ok) {
            await cache.put(cacheRequest, response.clone());
          }

          return response;
        } catch (error) {
          return new Response("Offline image unavailable", {
            status: 503,
            statusText: "Offline"
          });
        }
      }

      try {
        const cachedResponse = await caches.match(event.request);

        if (cachedResponse) {
          return event.request.mode === "navigate"
            ? await injectAuthScript(cachedResponse)
            : cachedResponse;
        }

        const response = await fetch(event.request);

        if (response && response.status === 200 && response.type === "basic") {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }

        return event.request.mode === "navigate"
          ? await injectAuthScript(response)
          : response;
      } catch (error) {
        if (event.request.mode === "navigate") {
          const fallback = await caches.match("./index.html");
          return await injectAuthScript(fallback);
        }

        return new Response("Offline", {
          status: 503,
          statusText: "Offline"
        });
      }
    })()
  );
});
