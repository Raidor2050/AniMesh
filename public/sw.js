/* AniMesh service worker — app shell precache + runtime cache-first for assets.
 * Rooted at the deployment base via registration scope so the same SW works in
 * dev/site builds. Purely progressive: failing silently is always acceptable. */
const CACHE = 'animesh-v2'
const scope = self.registration.scope
const CORE = [scope, scope + 'index.html', scope + 'manifest.webmanifest']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(CORE))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // Navigations: network-first with offline fallback to the cached shell.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(scope + 'index.html', copy))
          return res
        })
        .catch(() => caches.match(scope + 'index.html'))
    )
    return
  }

  // Hashed/static assets (Vite chunks, icons): cache-first, fill on miss.
  event.respondWith(
    caches.match(request).then(
      (hit) =>
        hit ||
        fetch(request).then((res) => {
          if (res.ok) {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(request, copy))
          }
          return res
        })
    )
  )
})