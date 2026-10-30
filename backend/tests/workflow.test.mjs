// API tests for the guide review workflow, verification, and version history.
//
// Run against a throwaway database, never a real one: the tests create accounts and guides.
//   1. Create a database from database/schema.sql and the seeders.
//   2. Start the API with DB_DATABASE set to it.
//   3. node --test "backend/tests/*.test.mjs"
//
// API_URL overrides the default http://127.0.0.1:8000/api.
import assert from 'node:assert/strict'
import { before, test } from 'node:test'
import { API, client, PASSWORD, SEED_ADMIN } from './helpers.mjs'

const stamp = Date.now()

const admin = client()
const editor = client()
const reviewer = client()
const visitor = client()
let lookups

const guide = (title) => ({
  title,
  agency_id: lookups.agencies[0].id,
  category_id: lookups.categories[0].id,
  requirements: [{ requirement_text: 'Valid ID' }],
  steps: [{ title: 'Go to the office' }],
  sources: [{ label: 'Official site', url: 'https://example.gov.ph', verified_at: null }],
})

async function createDraft(title) {
  const result = await editor.post('/admin/services', guide(title))
  assert.equal(result.status, 201, JSON.stringify(result.json))
  return result.json.data
}

const setStatus = (who, id, status) => who.post(`/admin/services/${id}/status`, { status })

async function publishedGuide(title) {
  const { id, slug } = await createDraft(title)
  assert.equal((await setStatus(editor, id, 'for_review')).status, 200)
  assert.equal((await setStatus(reviewer, id, 'approved')).status, 200)
  assert.equal((await setStatus(admin, id, 'published')).status, 200)
  return { id, slug }
}

before(async () => {
  await admin.signIn(...SEED_ADMIN)
  for (const [person, role] of [[editor, 'editor'], [reviewer, 'reviewer']]) {
    const email = `${role}-${stamp}@example.com`
    const created = await admin.post('/admin/admins', { name: `Test ${role}`, email, role, password: PASSWORD })
    assert.equal(created.status, 201, JSON.stringify(created.json))
    await person.signIn(email, PASSWORD)
  }
  lookups = (await admin.get('/admin/lookups')).json.data
})

test('a guide goes from draft through review to published', async () => {
  const { id, slug } = await publishedGuide(`Full workflow ${stamp}`)
  const live = await visitor.get(`/services/${slug}`)
  assert.equal(live.status, 200)
  assert.equal(live.json.data.verification_status, 'unverified')
  assert.equal((await admin.get(`/admin/services/${id}`)).json.data.status, 'published')
})

test('new guides start unverified and stay off the public site', async () => {
  const { slug, verification_status, last_verified_at } = await createDraft(`Private draft ${stamp}`)
  assert.equal(verification_status, 'unverified')
  assert.equal(last_verified_at, null)
  assert.equal((await visitor.get(`/services/${slug}`)).status, 404)
})

test('review steps cannot be skipped, even by a super admin', async () => {
  const { id } = await createDraft(`No skipping ${stamp}`)
  assert.equal((await setStatus(admin, id, 'published')).status, 422)
  assert.equal((await setStatus(admin, id, 'approved')).status, 422)
})

test('an empty guide cannot be submitted for review', async () => {
  const created = await editor.post('/admin/services', { ...guide(`Empty ${stamp}`), requirements: [], steps: [] })
  assert.equal((await setStatus(editor, created.json.data.id, 'for_review')).status, 422)
})

test('roles are enforced on the server', async () => {
  const { id } = await createDraft(`Role limits ${stamp}`)
  assert.equal((await setStatus(reviewer, id, 'for_review')).status, 403, 'reviewers do not submit')
  assert.equal((await setStatus(editor, id, 'for_review')).status, 200)
  assert.equal((await setStatus(editor, id, 'approved')).status, 403, 'editors do not approve')
  assert.equal((await setStatus(reviewer, id, 'approved')).status, 200)
  assert.equal((await setStatus(reviewer, id, 'published')).status, 403, 'reviewers do not publish')
  assert.equal((await setStatus(editor, id, 'published')).status, 403, 'editors do not publish')
  assert.equal((await setStatus(admin, id, 'published')).status, 200)
  assert.equal((await setStatus(editor, id, 'draft')).status, 403, 'editors do not unpublish')
  assert.equal((await setStatus(editor, id, 'archived')).status, 403, 'editors do not archive published guides')
})

test('a reviewer can send a guide back to draft', async () => {
  const { id } = await createDraft(`Sent back ${stamp}`)
  await setStatus(editor, id, 'for_review')
  assert.equal((await setStatus(reviewer, id, 'draft')).status, 200)
  assert.equal((await admin.get(`/admin/services/${id}`)).json.data.status, 'draft')
})

test('editors can only change drafts', async () => {
  const { id } = await createDraft(`Edit limits ${stamp}`)
  assert.equal((await editor.put(`/admin/services/${id}`, guide(`Edit limits changed ${stamp}`))).status, 200)
  await setStatus(editor, id, 'for_review')
  assert.equal((await editor.put(`/admin/services/${id}`, guide(`Blocked ${stamp}`))).status, 403)
  assert.equal((await reviewer.put(`/admin/services/${id}`, guide(`Blocked ${stamp}`))).status, 403)
})

test('editing never verifies a guide, and changing a verified guide resets it', async () => {
  const { id } = await publishedGuide(`Verify me ${stamp}`)
  const edited = await admin.put(`/admin/services/${id}`, guide(`Verify me edited ${stamp}`))
  assert.equal(edited.json.data.verification_status, 'unverified')

  const today = new Date().toISOString().slice(0, 10)
  const verified = await reviewer.post(`/admin/services/${id}/verification`, { verification_status: 'verified', last_verified_at: today })
  assert.equal(verified.status, 200, JSON.stringify(verified.json))
  assert.equal(verified.json.data.verification_status, 'verified')

  const changed = await admin.put(`/admin/services/${id}`, guide(`Verify me again ${stamp}`))
  assert.equal(changed.json.data.verification_status, 'needs_review')
  assert.equal(changed.json.data.last_verified_at, today, 'the last check date is kept')
})

test('verification has rules of its own', async () => {
  const { id } = await createDraft(`Verification rules ${stamp}`)
  const url = `/admin/services/${id}/verification`
  assert.equal((await editor.post(url, { verification_status: 'verified', last_verified_at: '2026-01-01' })).status, 403)
  assert.equal((await reviewer.post(url, { verification_status: 'verified' })).status, 422, 'needs a date')
  assert.equal((await reviewer.post(url, { verification_status: 'verified', last_verified_at: '2999-01-01' })).status, 422, 'no future dates')
  assert.equal((await reviewer.post(url, { verification_status: 'nonsense' })).status, 422)

  const noSources = await editor.post('/admin/services', { ...guide(`No sources ${stamp}`), sources: [] })
  const blocked = await reviewer.post(`/admin/services/${noSources.json.data.id}/verification`, { verification_status: 'verified', last_verified_at: '2026-01-01' })
  assert.equal(blocked.status, 422, 'needs an official source')
})

test('version history records changes and can restore them', async () => {
  const original = `Original title ${stamp}`
  const { id } = await publishedGuide(original)
  await admin.put(`/admin/services/${id}`, { ...guide(`Changed title ${stamp}`), slug: `version-test-${stamp}`, change_summary: 'Fixed the title' })

  const history = await reviewer.get(`/admin/services/${id}/revisions`)
  assert.equal(history.status, 200)
  assert.equal(history.json.data.length, 1)
  assert.equal(history.json.data[0].change_summary, 'Fixed the title')
  assert.equal(history.json.data[0].admin_name, 'System Administrator')

  const revisionId = history.json.data[0].id
  const old = await reviewer.get(`/admin/services/${id}/revisions/${revisionId}`)
  assert.equal(old.json.data.snapshot.title, original)

  assert.equal((await editor.post(`/admin/services/${id}/revisions/${revisionId}/restore`)).status, 403)
  const restored = await admin.post(`/admin/services/${id}/revisions/${revisionId}/restore`)
  assert.equal(restored.status, 200, JSON.stringify(restored.json))
  assert.equal(restored.json.data.title, original)
  assert.equal(restored.json.data.status, 'published')
  assert.equal((await admin.get(`/admin/services/${id}/revisions`)).json.data.length, 2, 'the restore is undoable')
})

test('a revision cannot be read through another guide', async () => {
  const first = await publishedGuide(`Revision owner ${stamp}`)
  const other = await createDraft(`Other guide ${stamp}`)
  await admin.put(`/admin/services/${first.id}`, guide(`Revision owner changed ${stamp}`))
  const [{ id: revisionId }] = (await admin.get(`/admin/services/${first.id}/revisions`)).json.data
  assert.equal((await admin.get(`/admin/services/${other.id}/revisions/${revisionId}`)).status, 404)
})

test('admin actions need a session and a CSRF token', async () => {
  assert.equal((await visitor.get('/admin/services')).status, 401)
  const { id } = await createDraft(`CSRF ${stamp}`)
  const signedOut = await fetch(`${API}/admin/services/${id}/status`, { method: 'POST', body: '{"status":"for_review"}' })
  assert.equal(signedOut.status, 401)
  assert.equal((await editor.postWithoutToken(`/admin/services/${id}/status`, { status: 'for_review' })).status, 419)
})

test('the dashboard counts guides waiting for review', async () => {
  const { id } = await createDraft(`Dashboard ${stamp}`)
  const before = (await admin.get('/admin/dashboard')).json.data.counts?.for_review ?? (await admin.get('/admin/dashboard')).json.data.for_review
  await setStatus(editor, id, 'for_review')
  const after = (await admin.get('/admin/dashboard')).json.data.counts?.for_review ?? (await admin.get('/admin/dashboard')).json.data.for_review
  assert.equal(after, before + 1)
})
