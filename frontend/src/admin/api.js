let csrfToken = null
let onUnauthorized = null

export function setCsrfToken(token) {
  csrfToken = token
}

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler
}

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message)
    this.status = status
    this.details = details || {}
  }
}

async function request(path, { method = 'GET', body } = {}) {
  const isUpload = body instanceof FormData
  const headers = { Accept: 'application/json' }
  if (body !== undefined && !isUpload) headers['Content-Type'] = 'application/json'
  if (method !== 'GET' && csrfToken) headers['X-CSRF-Token'] = csrfToken

  const response = await fetch(`/api/admin${path}`, {
    method,
    headers,
    credentials: 'same-origin',
    body: body === undefined || isUpload ? body : JSON.stringify(body),
  })
  const json = await response.json().catch(() => null)

  if (!response.ok || !json?.success) {
    if (response.status === 401 && path !== '/login' && path !== '/me') onUnauthorized?.()
    throw new ApiError(json?.error || `Request failed (${response.status})`, response.status, json?.details)
  }

  return json.data
}

function query(params) {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value)
  })
  const text = search.toString()
  return text ? `?${text}` : ''
}

export const adminApi = {
  me: () => request('/me'),
  login: (email, password) => request('/login', { method: 'POST', body: { email, password } }),
  logout: () => request('/logout', { method: 'POST' }),
  lookups: () => request('/lookups'),
  listServices: ({ q, status, needsReview } = {}) =>
    request(`/services${query({ q, status, needs_review: needsReview ? '1' : '' })}`),
  getService: (id) => request(`/services/${encodeURIComponent(id)}`),
  createService: (data) => request('/services', { method: 'POST', body: data }),
  updateService: (id, data) => request(`/services/${encodeURIComponent(id)}`, { method: 'PUT', body: data }),
  setServiceStatus: (id, status) =>
    request(`/services/${encodeURIComponent(id)}/status`, { method: 'POST', body: { status } }),
  dashboard: () => request('/dashboard'),
  activity: ({ page, type, adminId } = {}) => request(`/activity${query({ page: page > 1 ? String(page) : '', type, admin_id: adminId })}`),
  reports: (status) => request(`/reports${query({ status })}`),
  updateReport: (id, data) => request(`/reports/${encodeURIComponent(id)}`, { method: 'PUT', body: data }),
  admins: () => request('/admins'),
  createAdmin: (data) => request('/admins', { method: 'POST', body: data }),
  updateAdmin: (id, data) => request(`/admins/${encodeURIComponent(id)}`, { method: 'PUT', body: data }),
  resetAdminPassword: (id, password) => request(`/admins/${encodeURIComponent(id)}/password`, { method: 'POST', body: { password } }),
  changePassword: (currentPassword, newPassword) =>
    request('/account/password', { method: 'POST', body: { current_password: currentPassword, new_password: newPassword } }),
  // resource: 'agencies' | 'offices' | 'categories'
  list: (resource) => request(`/${resource}`),
  create: (resource, data) => request(`/${resource}`, { method: 'POST', body: data }),
  update: (resource, id, data) => request(`/${resource}/${encodeURIComponent(id)}`, { method: 'PUT', body: data }),
  uploadAgencyLogo: (id, file) => {
    const body = new FormData()
    body.append('logo', file)
    return request(`/agencies/${encodeURIComponent(id)}/logo`, { method: 'POST', body })
  },
  removeAgencyLogo: (id) => request(`/agencies/${encodeURIComponent(id)}/logo`, { method: 'DELETE' }),
}
