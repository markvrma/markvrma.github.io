// only needed when the app is served (localhost or https). chrome will not offer a real
// install without a service worker that handles fetch. caches the page so it opens offline.
const CACHE = "kanban-v2";

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(["./", "./index.html"])).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const store = (req, res) => {
  const copy = res.clone();
  caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
  return res;
};

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  // pages go network first so an edit actually reaches an installed app, cache is the
  // fallback when there is no network. everything else is cache first, it never changes
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request)
        .then(res => store(e.request, res))
        .catch(() => caches.match(e.request).then(hit => hit || caches.match("./index.html")))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(hit => hit ||
      fetch(e.request).then(res => store(e.request, res)).catch(() => caches.match("./index.html")))
  );
});
