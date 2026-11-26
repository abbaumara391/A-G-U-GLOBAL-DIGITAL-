// ==========================================
// A G U GLOBAL DIGITAL
// SERVICE WORKER V3
// ==========================================

const CACHE_NAME = "agu-global-digital-v3";

const APP_FILES = [
"./",
"./index.html",
"./styles.css",
"./config.js",
"./app.js",
"./manifest.json"
];

self.addEventListener("install", event => {
event.waitUntil(
caches.open(CACHE_NAME)
.then(cache => cache.addAll(APP_FILES))
);

self.skipWaiting();
});

self.addEventListener("activate", event => {
event.waitUntil(
caches.keys().then(cacheNames =>
Promise.all(
cacheNames
.filter(name =>
name.startsWith("agu-global-digital-") &&
name !== CACHE_NAME
)
.map(name => caches.delete(name))
)
)
);

self.clients.claim();
});

self.addEventListener("fetch", event => {
const request = event.request;

if (request.method !== "GET") return;

const url = new URL(request.url);

if (url.origin !== self.location.origin) return;

event.respondWith(
fetch(request)
.then(response => {
if (response.ok && response.type === "basic") {
const copy = response.clone();

      caches.open(CACHE_NAME)
        .then(cache => cache.put(request, copy));
    }

    return response;
  })
  .catch(async () => {
    const cached = await caches.match(request);

    if (cached) return cached;

    return new Response("You are offline.", {
      status: 503,
      headers: {
        "Content-Type": "text/plain"
      }
    });
  })

);
});
