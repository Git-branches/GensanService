// Shared by the API tests. See workflow.test.mjs for how to run them safely.
import assert from 'node:assert/strict'

export const API = process.env.API_URL ?? 'http://127.0.0.1:8000/api'
export const PASSWORD = 'Test-Password-2026!'
export const SEED_ADMIN = ['admin@gensan-service-navigator.local', 'ChangeMe123!']

// One signed-in session: keeps its own cookie and CSRF token.
export function client() {
  let cookie = ''
  let csrf = ''
  async function call(method, path, body, sendToken = true) {
    const response = await fetch(`${API}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(cookie && { Cookie: cookie }),
        ...(csrf && sendToken && { 'X-CSRF-Token': csrf }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const setCookie = response.headers.get('set-cookie')
    if (setCookie) cookie = setCookie.split(';')[0]
    return { status: response.status, json: await response.json().catch(() => null) }
  }
  return {
    get: (path) => call('GET', path),
    post: (path, body = {}) => call('POST', path, body),
    postWithoutToken: (path, body = {}) => call('POST', path, body, false),
    put: (path, body) => call('PUT', path, body),
    async signIn(email, password) {
      const result = await call('POST', '/admin/login', { email, password })
      assert.equal(result.status, 200, `sign-in failed for ${email}`)
      csrf = result.json.data.csrf_token
    },
  }
}

// Creates a guide and moves it through review to published.
export async function publish(admin, editor, reviewer, body) {
  const created = await editor.post('/admin/services', body)
  assert.equal(created.status, 201, JSON.stringify(created.json))
  const { id, slug } = created.json.data
  for (const [who, status] of [[editor, 'for_review'], [reviewer, 'approved'], [admin, 'published']]) {
    const moved = await who.post(`/admin/services/${id}/status`, { status })
    assert.equal(moved.status, 200, JSON.stringify(moved.json))
  }
  return { id, slug }
}
