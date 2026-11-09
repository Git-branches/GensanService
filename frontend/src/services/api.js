const BASE_URL = '/api'

// Public reads change slowly, and several parts of the site ask for the same lists (categories,
// agencies, announcements). Keep a short in-memory cache and share one request when two components
// ask at the same time. Writes are never cached. The minute matches the API's Cache-Control.
const CACHE_TTL = 60_000
const CACHE_LIMIT = 100
const cache = new Map()
const inFlight = new Map()

async function send(path, options) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  const body = await response.json().catch(() => null)

  if (!response.ok || !body?.success) {
    const error = new Error(body?.error || `Request failed with status ${response.status}`)
    error.status = response.status
    error.details = body?.details || {}
    throw error
  }

  return body.data
}

function request(path, options = {}) {
  if ((options.method ?? 'GET') !== 'GET') return send(path, options)

  const saved = cache.get(path)
  if (saved && saved.expires > Date.now()) return Promise.resolve(saved.data)

  const pending = inFlight.get(path)
  if (pending) return pending

  const promise = send(path, options)
    .then((data) => {
      if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value)
      cache.set(path, { data, expires: Date.now() + CACHE_TTL })
      return data
    })
    .finally(() => inFlight.delete(path))

  inFlight.set(path, promise)
  return promise
}

/** Clears the in-memory read cache. Used by tests. */
export function clearApiCache() {
  cache.clear()
  inFlight.clear()
}

export function reportIssue(slug, data) {
  return request(`/services/${encodeURIComponent(slug)}/reports`, { method: 'POST', body: JSON.stringify(data) })
}

export function search(q) {
  return request(`/search?q=${encodeURIComponent(q)}`)
}

export function getFaqs(lang) {
  return request(`/faqs?lang=${encodeURIComponent(lang)}`)
}

export function recordView(slug) {
  return request(`/services/${encodeURIComponent(slug)}/view`, { method: 'POST' })
}

// helpful is true or false; reason is one of outdated, missing, unclear, other, and only goes with false.
export function sendFeedback(slug, helpful, reason) {
  return request(`/services/${encodeURIComponent(slug)}/feedback`, {
    method: 'POST',
    body: JSON.stringify(reason ? { helpful, reason } : { helpful }),
  })
}

export function getLifeEvents() {
  return request('/life-events')
}

export function getLifeEvent(slug) {
  return request(`/life-events/${encodeURIComponent(slug)}`)
}

export function getAnnouncements() {
  return request('/announcements')
}

export function getStats() {
  return request('/stats')
}

export function getCategories() {
  return request('/categories')
}

export function getAgencies() {
  return request('/agencies')
}

export function getAgency(slug) {
  return request(`/agencies/${encodeURIComponent(slug)}`)
}

export function getOffices() {
  return request('/offices')
}

export function getServices({ q, category, agency, sort, limit } = {}) {
  const params = new URLSearchParams()
  if (q) params.set('q', q)
  if (category) params.set('category', category)
  if (agency) params.set('agency', agency)
  if (sort) params.set('sort', sort)
  if (limit) params.set('limit', String(limit))
  const query = params.toString()
  return request(`/services${query ? `?${query}` : ''}`)
}

export function getService(slug) {
  return request(`/services/${encodeURIComponent(slug)}`)
}
