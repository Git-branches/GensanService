// API tests for the admin tools: logging, duplication, preview, FAQ, notices, verification, and reports.
// Run them the same way as workflow.test.mjs, against a throwaway database.
import assert from 'node:assert/strict'
import { before, test } from 'node:test'
import { client, PASSWORD, publish, SEED_ADMIN } from './helpers.mjs'

const stamp = Date.now()
const admin = client()
const editor = client()
const reviewer = client()
const visitor = client()
let lookups

const guide = (title, extra = {}) => ({
  title,
  agency_id: lookups.agencies[0].id,
  category_id: lookups.categories[0].id,
  requirements: [{ requirement_text: 'Valid ID', notes: 'Bring a copy', is_optional: true }],
  steps: [{ title: 'Go to the office', instructions: 'Bring your ID' }],
  eligibility: ['Any resident'],
  sources: [{ label: 'Official site', url: 'https://example.gov.ph' }],
  ...extra,
})
const faq = (extra = {}) => ({
  category: 'about',
  display_order: 50,
  is_active: true,
  translations: { en: { question: `Test question ${stamp}?`, answer: 'A test answer.' } },
  ...extra,
})
const notice = (extra = {}) => ({ title: `Notice ${stamp}`, message: 'Testing a notice.', type: 'info', is_published: true, ...extra })
const local = (offsetHours) => new Date(Date.now() + offsetHours * 3600000 + 8 * 3600000).toISOString().slice(0, 16)
const liveNotices = async () => (await visitor.get('/announcements')).json.data

before(async () => {
  await admin.signIn(...SEED_ADMIN)
  for (const [person, role] of [[editor, 'editor'], [reviewer, 'reviewer']]) {
    const email = `admin-${role}-${stamp}@example.com`
    const created = await admin.post('/admin/admins', { name: `Test ${role}`, email, role, password: PASSWORD })
    assert.equal(created.status, 201, JSON.stringify(created.json))
    await person.signIn(email, PASSWORD)
  }
  lookups = (await admin.get('/admin/lookups')).json.data
})

test('a next review date in the future can be saved', async () => {
  const { id } = (await editor.post('/admin/services', guide(`Review date ${stamp}`))).json.data
  const result = await reviewer.post(`/admin/services/${id}/verification`, { verification_status: 'needs_review', next_review_at: '2999-01-01' })
  assert.equal(result.status, 200, JSON.stringify(result.json))
  assert.equal(result.json.data.next_review_at, '2999-01-01')
})

test('overdue guides can be found and are counted', async () => {
  const { id } = (await editor.post('/admin/services', guide(`Overdue ${stamp}`))).json.data
  await reviewer.post(`/admin/services/${id}/verification`, { verification_status: 'needs_review', next_review_at: '2020-01-01' })
  const list = (await admin.get('/admin/services?overdue=1')).json.data
  assert.ok(list.some((s) => s.id === id))
  assert.ok((await admin.get('/admin/dashboard')).json.data.counts.overdue >= 1)
  assert.ok((await admin.get('/admin/services?verification=needs_review')).json.data.some((s) => s.id === id))
})

test('failed sign-ins are logged without the password', async () => {
  const secret = `Wrong-${stamp}`
  const email = `nobody-${stamp}@example.com`
  const failed = client()
  await failed.post('/admin/login', { email, password: secret })
  await failed.post('/admin/login', { email: `secret-typed-here-${stamp}`, password: secret })

  const log = (await admin.get('/admin/activity?type=auth')).json.data.items
  const entry = log.find((item) => item.action === 'auth.login_failed' && item.details?.email === email)
  assert.ok(entry, 'the failed attempt is listed')
  assert.equal(entry.admin_name, null)
  assert.ok(log.some((item) => item.action === 'auth.login_failed' && item.details?.email === '(not an email address)'), 'text that is not an email is not stored')
  assert.ok(!JSON.stringify(log).includes(secret), 'the password is never stored')
  assert.ok(!JSON.stringify(log).includes('secret-typed-here'))
})

test('the activity log filters by date', async () => {
  const today = new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10)
  assert.ok((await admin.get(`/admin/activity?from=${today}&to=${today}`)).json.data.total > 0)
  assert.equal((await admin.get('/admin/activity?to=2001-01-01')).json.data.total, 0)
  assert.equal((await admin.get("/admin/activity?from=x'%20OR%201=1")).status, 200)
})

test('duplicating makes an unverified draft with its own copies', async () => {
  const today = new Date().toISOString().slice(0, 10)
  const source = await publish(admin, editor, reviewer, guide(`Original ${stamp}`))
  await reviewer.post(`/admin/services/${source.id}/verification`, { verification_status: 'verified', last_verified_at: today })

  assert.equal((await reviewer.post(`/admin/services/${source.id}/duplicate`)).status, 403)
  const copy = await editor.post(`/admin/services/${source.id}/duplicate`)
  assert.equal(copy.status, 201, JSON.stringify(copy.json))

  const data = copy.json.data
  assert.equal(data.title, `Copy of Original ${stamp}`)
  assert.equal(data.status, 'draft')
  assert.equal(data.verification_status, 'unverified')
  assert.equal(data.last_verified_at, null)
  assert.notEqual(data.slug, source.slug)
  assert.equal(data.requirements[0].requirement_text, 'Valid ID')
  assert.equal(data.requirements[0].is_optional, true)
  assert.equal(data.steps[0].title, 'Go to the office')
  assert.equal(data.sources.length, 1)

  const original = (await admin.get(`/admin/services/${source.id}`)).json.data
  assert.notEqual(data.requirements[0].id, original.requirements[0].id, 'requirements are not shared')
})

test('a draft can be previewed by admins only', async () => {
  const { id, slug } = (await editor.post('/admin/services', guide(`Preview ${stamp}`))).json.data
  const seen = await reviewer.get(`/admin/services/${id}/preview`)
  assert.equal(seen.status, 200)
  assert.equal(seen.json.data.slug, slug)
  assert.ok(Array.isArray(seen.json.data.offices), 'it has the same shape as the public guide')
  assert.equal((await visitor.get(`/admin/services/${id}/preview`)).status, 401)
  assert.equal((await visitor.get(`/services/${slug}`)).status, 404)
})

test('a reviewer can leave a note when sending a guide back', async () => {
  const { id } = (await editor.post('/admin/services', guide(`Note ${stamp}`))).json.data
  await editor.post(`/admin/services/${id}/status`, { status: 'for_review' })
  const back = await reviewer.post(`/admin/services/${id}/status`, { status: 'draft', note: 'The fee looks old.' })
  assert.equal(back.json.data.review_note, 'The fee looks old.')
  const again = await editor.post(`/admin/services/${id}/status`, { status: 'for_review' })
  assert.equal(again.json.data.review_note, null, 'cleared on resubmitting')
})

test('FAQs can be managed, and a blank language falls back to English', async () => {
  assert.equal((await reviewer.post('/admin/faqs', faq())).status, 403)
  assert.equal((await editor.post('/admin/faqs', faq({ translations: { en: { question: '', answer: '' } } }))).status, 422, 'English is required')
  assert.equal((await editor.post('/admin/faqs', faq({ category: 'nonsense' }))).status, 422)

  const created = await editor.post('/admin/faqs', faq())
  assert.equal(created.status, 201, JSON.stringify(created.json))
  const { id } = created.json.data
  const bisaya = (await visitor.get('/faqs?lang=ceb')).json.data.find((f) => f.id === id)
  assert.equal(bisaya.question, `Test question ${stamp}?`)

  const translated = faq({ translations: { en: { question: `Test question ${stamp}?`, answer: 'A test answer.' }, ceb: { question: 'Pangutana?', answer: 'Tubag.' } } })
  await editor.put(`/admin/faqs/${id}`, translated)
  assert.equal((await visitor.get('/faqs?lang=ceb')).json.data.find((f) => f.id === id).question, 'Pangutana?')

  await editor.put(`/admin/faqs/${id}`, { ...translated, is_active: false })
  assert.ok(!(await visitor.get('/faqs?lang=en')).json.data.some((f) => f.id === id), 'hidden questions leave the public site')
  assert.ok((await admin.get('/admin/faqs')).json.data.some((f) => f.id === id), 'but stay in the admin panel')
})

test('notices show only while published and in their time window', async () => {
  const live = await editor.post('/admin/notices', notice({ title: `Live ${stamp}` }))
  assert.equal(live.status, 201, JSON.stringify(live.json))
  await editor.post('/admin/notices', notice({ title: `Unpublished ${stamp}`, is_published: false }))
  await editor.post('/admin/notices', notice({ title: `Future ${stamp}`, starts_at: local(24) }))
  await editor.post('/admin/notices', notice({ title: `Ended ${stamp}`, starts_at: local(-48), ends_at: local(-24) }))

  const titles = (await liveNotices()).map((n) => n.title)
  assert.ok(titles.includes(`Live ${stamp}`))
  assert.ok(!titles.includes(`Unpublished ${stamp}`))
  assert.ok(!titles.includes(`Future ${stamp}`))
  assert.ok(!titles.includes(`Ended ${stamp}`))

  assert.equal((await reviewer.post('/admin/notices', notice())).status, 403)
  assert.equal((await editor.post('/admin/notices', notice({ starts_at: local(5), ends_at: local(2) }))).status, 422, 'the end comes after the start')
  await editor.put(`/admin/notices/${live.json.data.id}`, notice({ title: `Live ${stamp}`, is_published: false }))
  assert.ok(!(await liveNotices()).some((n) => n.title === `Live ${stamp}`))
})

test('replacing the site is limited and always has an end', async () => {
  const fullPage = { type: 'maintenance', full_page: true, ends_at: local(1), is_published: false }
  assert.equal((await editor.post('/admin/notices', notice(fullPage))).status, 422, 'not for editors')
  assert.equal((await admin.post('/admin/notices', notice({ ...fullPage, ends_at: null }))).status, 422, 'needs an end time')
  assert.equal((await admin.post('/admin/notices', notice({ ...fullPage, type: 'info' }))).status, 422, 'maintenance notices only')
  assert.equal((await admin.post('/admin/notices', notice(fullPage))).status, 201)
})

test('agency verification is separate from editing', async () => {
  const agency = (await visitor.get('/agencies')).json.data[0]
  const url = `/admin/agencies/${agency.id}/verification`
  assert.equal((await editor.post(url, { verification_status: 'verified', last_verified_at: '2026-01-01' })).status, 403)
  assert.equal((await reviewer.post(url, { verification_status: 'verified' })).status, 422, 'needs a date')
  assert.equal((await reviewer.post(url, { verification_status: 'verified', last_verified_at: '2026-01-01' })).status, 200)
  const shown = (await visitor.get(`/agencies/${agency.slug}`)).json.data
  assert.equal(shown.verification_status, 'verified')
  assert.equal(shown.last_verified_at, '2026-01-01')
  await reviewer.post(url, { verification_status: 'unverified' })
})

test('reports keep a resolution, and new ones show in the sidebar count', async () => {
  const { slug } = await publish(admin, editor, reviewer, guide(`Report ${stamp}`))
  const before = (await admin.get('/admin/notifications')).json.data.open_reports
  const sent = await visitor.post(`/services/${slug}/reports`, { reason: 'wrong_fee', message: 'The fee on this guide looks wrong.' })
  assert.equal(sent.status, 201, JSON.stringify(sent.json))
  assert.equal((await admin.get('/admin/notifications')).json.data.open_reports, before + 1)

  const [report] = (await admin.get('/admin/reports?status=pending')).json.data.reports
  const saved = await reviewer.put(`/admin/reports/${report.id}`, { status: 'resolved', admin_note: 'Called the office.', resolution: 'Updated the fee.' })
  assert.equal(saved.status, 200, JSON.stringify(saved.json))
  const after = (await admin.get('/admin/reports?status=resolved')).json.data.reports.find((r) => r.id === report.id)
  assert.equal(after.resolution, 'Updated the fee.')
})
