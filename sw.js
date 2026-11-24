// ==========================================
// A G U GLOBAL DIGITAL
// SERVICE WORKER
// ==========================================

const CACHE_NAME = "agu-global-digital-v1";

const APP_FILES = [
  "./",
  "./index.html",
  "./styles.css",
  "./config.js",
  "./app.js",
  "./manifest.json"
];


// ==========================================
// INSTALL
// ==========================================

self.addEventListener("install", event => {

  event.waitUntil(

    caches.open(CACHE_NAME).then(cache => {

      return cache.addAll(APP_FILES);

    })

  );

  self.skipWaiting();

});


// ==========================================
// ACTIVATE
// ==========================================

self.addEventListener("activate", event => {

  event.waitUntil(

    caches.keys().then(cacheNames => {

      return Promise.all(

        cacheNames

          .filter(name => name !== CACHE_NAME)

          .map(name => caches.delete(name))

      );

    })

  );

  self.clients.claim();

});


// ==========================================
// FETCH
// ==========================================

self.addEventListener("fetch", event => {

  const request = event.request;

  // Only handle normal page requests.
  if (request.method !== "GET") {
    return;
  }

  const requestURL = new URL(request.url);

  // Never cache external services or Supabase data.
  if (requestURL.origin !== self.location.origin) {
    return;
  }

  // Only handle navigation and static application files.
  event.respondWith(

    caches.match(request).then(cachedResponse => {

      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then(response => {

        if (
          response &&
          response.status === 200 &&
          response.type === "basic"
        ) {

          const responseCopy = response.clone();

          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseCopy);
          });

        }

        return response;

      });

    })

  );

});
