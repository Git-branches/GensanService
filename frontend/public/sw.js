// Offline support: pages and guides people have opened keep working without signal, such as in a line
// inside a government office. scripts/prerender.mjs fills in VERSION and PRECACHE when the site is built.
// Keep the cache names in step with src/utils/offline.js.
const VERSION = 'dev'
const PRECACHE = []

const SHELL = `andam-shell-${VERSION}`
const PAGES = 'andam-pages'
const DATA = 'andam-data'
const IMAGES = 'andam-images'
const LIMITS = { [PAGES]: 60, [DATA]: 150, [IMAGES]: 150 }
// On a weak signal, wait this long before showing a saved copy instead.
const NETWORK_TIMEOUT = 6000

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith('andam-shell-') && key !== SHELL).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

async function trim(name) {
  const cache = await caches.open(name)
  const keys = await cache.keys()
  await Promise.all(keys.slice(0, Math.max(0, keys.length - LIMITS[name])).map((key) => cache.delete(key)))
}

async function store(name, request, response) {
  const cache = await caches.open(name)
  await cache.put(request, response)
  await trim(name)
}

// The network's answer when it comes in time; otherwise a saved copy, then the fallback.
async function networkFirst(event, name, fallback) {
  const { request } = event
  const network = fetch(request).then((response) => {
    if (response.ok) event.waitUntil(store(name, request, response.clone()))
    return response
  })
  try {
    return await Promise.race([network, new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), NETWORK_TIMEOUT))])
  } catch {
    const saved = (await caches.match(request)) ?? (fallback ? await fallback() : undefined)
    return saved ?? network
  }
}

async function cacheFirst(event, name) {
  const saved = await caches.match(event.request)
  if (saved) return saved
  const response = await fetch(event.request)
  if (response.ok) event.waitUntil(store(name, event.request, response.clone()))
  return response
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  const path = url.pathname

  // The admin panel always needs the live server.
  if (path.startsWith('/admin') || path.startsWith('/api/admin')) return

  if (path.startsWith('/assets/') && /\.(js|css)$/.test(path)) {
    event.respondWith(cacheFirst(event, SHELL))
  } else if (path.startsWith('/api/uploads/') || /\.(png|webp|svg|jpe?g|woff2)$/.test(path)) {
    event.respondWith(cacheFirst(event, IMAGES))
  } else if (path.startsWith('/api/')) {
    event.respondWith(networkFirst(event, DATA))
  } else if (request.mode === 'navigate') {
    // A page never opened before still loads offline: the app shell draws it from saved guide data.
    event.respondWith(networkFirst(event, PAGES, () => caches.match('/shell.html')))
  }
})
