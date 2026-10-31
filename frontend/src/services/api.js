const BASE_URL = '/api'

async function request(path, options = {}) {
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
