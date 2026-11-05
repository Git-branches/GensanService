// Saving a guide for offline use. The service worker (public/sw.js) already keeps pages and guides that
// were opened; saving makes sure both the page and its data are stored now, while there is signal.
// Keep the cache names in step with public/sw.js.
const PAGES_CACHE = 'andam-pages'
const DATA_CACHE = 'andam-data'
const SAVED_KEY = 'andam-saved-guides'

export function offlineSupported() {
  return typeof window !== 'undefined' && 'caches' in window && Boolean(navigator.serviceWorker?.controller)
}

function readSaved() {
  try {
    const value = JSON.parse(localStorage.getItem(SAVED_KEY))
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

export const isSaved = (slug) => readSaved().includes(slug)

export async function saveGuideOffline(slug) {
  const path = `/services/${encodeURIComponent(slug)}`
  await Promise.all([
    caches.open(PAGES_CACHE).then((cache) => cache.add(path)),
    caches.open(DATA_CACHE).then((cache) => cache.add(`/api${path}`)),
  ])
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify([slug, ...readSaved().filter((item) => item !== slug)].slice(0, 30)))
  } catch {
    // The guide is stored either way; only the "saved" label would be forgotten.
  }
}
