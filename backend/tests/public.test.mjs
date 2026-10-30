// API tests for what residents see: search, related guides, view counts, the FAQ, and directory details.
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
  category_id: lookups.categories.find((c) => c.name === 'Education').id,
  requirements: [{ requirement_text: 'Valid ID' }],
  steps: [{ title: 'Go to the office' }],
  sources: [{ label: 'Official site', url: 'https://example.gov.ph' }],
  ...extra,
})
const published = (title, extra) => publish(admin, editor, reviewer, guide(title, extra))
const titles = (result) => result.json.data.map((item) => item.title)

before(async () => {
  await admin.signIn(...SEED_ADMIN)
  for (const [person, role] of [[editor, 'editor'], [reviewer, 'reviewer']]) {
    const email = `public-${role}-${stamp}@example.com`
    const created = await admin.post('/admin/admins', { name: `Test ${role}`, email, role, password: PASSWORD })
    assert.equal(created.status, 201, JSON.stringify(created.json))
    await person.signIn(email, PASSWORD)
  }
  lookups = (await admin.get('/admin/lookups')).json.data
})

test('search finds a guide by a document it requires', async () => {
  const word = `zzdocument${stamp}`
  const title = `Requirement search ${stamp}`
  await published(title, { requirements: [{ requirement_text: `Original ${word}` }] })
  assert.deepEqual(titles(await visitor.get(`/services?q=${word}`)), [title])
  const found = await visitor.get(`/search?q=${word}`)
  assert.deepEqual(found.json.data.services.map((s) => s.title), [title])
})

test('search finds a guide by its keywords', async () => {
  const word = `zzkeyword${stamp}`
  const title = `Keyword search ${stamp}`
  await published(title, { search_keywords: `another name, ${word}` })
  assert.deepEqual(titles(await visitor.get(`/services?q=${word}`)), [title])
})

test('local words find official terms, and title matches rank first', async () => {
  const title = `Cedula ${stamp}`
  await published(title)
  assert.ok(titles(await visitor.get('/services?q=sedula')).includes(title))
  const other = `Other ${stamp}`
  await published(other, { search_keywords: `barangay${stamp}` })
  await published(`Barangay${stamp} clearance`)
  const ranked = titles(await visitor.get(`/services?q=barangay${stamp}`))
  assert.equal(ranked[0], `Barangay${stamp} clearance`)
  assert.ok(ranked.includes(other))
})

test('site-wide search groups agencies, offices, and categories', async () => {
  const { data } = (await visitor.get('/search?q=sss')).json
  assert.ok(data.agencies.some((a) => a.acronym === 'SSS'))
  assert.ok(data.offices.some((o) => o.name.includes('SSS')))
  const categories = (await visitor.get('/search?q=Education')).json.data.categories
  assert.ok(categories.some((c) => c.name === 'Education'))
})

test('a very short search returns nothing, and odd input is harmless', async () => {
  const short = (await visitor.get('/search?q=a')).json.data
  assert.deepEqual(short, { services: [], agencies: [], offices: [], categories: [] })

  const everything = (await visitor.get('/services')).json.data.length
  assert.ok((await visitor.get('/services?q=%25')).json.data.length < everything, '% is not a wildcard')
  for (const q of ["'; DROP TABLE services; --", '" OR "1"="1', '<script>alert(1)</script>']) {
    const result = await visitor.get(`/search?q=${encodeURIComponent(q)}`)
    assert.equal(result.status, 200)
  }
  assert.equal((await visitor.get('/services')).json.data.length, everything)
})

test('unpublished guides never reach residents', async () => {
  const word = `zzsecret${stamp}`
  const office = lookups.offices[0]
  const draft = await editor.post('/admin/services', guide(`Secret ${word}`, { search_keywords: word, office_ids: [office.id] }))
  assert.equal(draft.status, 201)
  const { id, slug } = draft.json.data

  const live = await published(`Links to a secret ${stamp}`, { related_ids: [id], requirements: [{ requirement_text: 'Paper', linked_service_id: id }] })

  assert.deepEqual((await visitor.get(`/services?q=${word}`)).json.data, [])
  assert.deepEqual((await visitor.get(`/search?q=${word}`)).json.data.services, [])
  assert.equal((await visitor.get(`/services/${slug}`)).status, 404)
  assert.equal((await visitor.post(`/services/${slug}/view`)).status, 404)

  const detail = (await visitor.get(`/services/${live.slug}`)).json.data
  assert.ok(!detail.related.some((r) => r.slug === slug), 'not in related guides')
  assert.equal(detail.requirements[0].linked_slug, null, 'not in linked requirements')

  const offices = (await visitor.get('/offices')).json.data
  assert.ok(!offices.find((o) => o.id === office.id).services.some((s) => s.slug === slug), 'not on office cards')
})

test('related guides work in both directions, and fall back to the same category', async () => {
  const first = await published(`Related one ${stamp}`)
  const second = await published(`Related two ${stamp}`, { related_ids: [first.id] })

  const fromSecond = (await visitor.get(`/services/${second.slug}`)).json.data.related
  assert.deepEqual(fromSecond.map((r) => r.slug), [first.slug])
  const fromFirst = (await visitor.get(`/services/${first.slug}`)).json.data.related
  assert.deepEqual(fromFirst.map((r) => r.slug), [second.slug])

  const lone = await published(`Related fallback ${stamp}`)
  const fallback = (await visitor.get(`/services/${lone.slug}`)).json.data.related
  assert.ok(fallback.length > 0 && fallback.every((r) => r.slug !== lone.slug))
})

test('a guide cannot be related to itself', async () => {
  const { id } = (await editor.post('/admin/services', guide(`Self ${stamp}`))).json.data
  const result = await editor.put(`/admin/services/${id}`, guide(`Self ${stamp}`, { related_ids: [id] }))
  assert.equal(result.status, 422)
})

test('views are counted and drive popular guides', async () => {
  const quiet = await published(`Quiet guide ${stamp}`)
  const busy = await published(`Busy guide ${stamp}`)
  await visitor.post(`/services/${quiet.slug}/view`)
  for (let i = 0; i < 3; i++) assert.equal((await visitor.post(`/services/${busy.slug}/view`)).status, 200)

  const popular = titles(await visitor.get('/services?sort=popular&limit=50'))
  assert.ok(popular.indexOf(`Busy guide ${stamp}`) < popular.indexOf(`Quiet guide ${stamp}`))
  assert.ok(popular.indexOf(`Quiet guide ${stamp}`) >= 0)
  assert.ok(!popular.includes(`Related one ${stamp}`), 'guides nobody opened are left out')
})

test('the FAQ comes in each language and falls back to English', async () => {
  const english = (await visitor.get('/faqs?lang=en')).json.data
  assert.equal(english.length, 9)
  assert.equal(english[0].question, 'What is Andam GenSan?')

  const bisaya = (await visitor.get('/faqs?lang=ceb')).json.data
  assert.equal(bisaya[0].question, 'Unsa ang Andam GenSan?')

  for (const lang of ['mdh', "x' OR 1=1"]) {
    const result = await visitor.get(`/faqs?lang=${encodeURIComponent(lang)}`)
    assert.equal(result.status, 200)
    assert.equal(result.json.data[0].question, 'What is Andam GenSan?')
  }
})

test('agency presence stays unconfirmed until someone sets it', async () => {
  const agency = (await visitor.get('/agencies')).json.data[0]
  assert.equal(agency.presence, 'unconfirmed')

  const created = await editor.post('/admin/agencies', { name: `Agency ${stamp}`, presence: 'physical_office' })
  assert.equal(created.status, 201, JSON.stringify(created.json))
  const list = (await visitor.get('/agencies')).json.data
  assert.equal(list.find((a) => a.name === `Agency ${stamp}`).presence, 'physical_office')

  await editor.put(`/admin/agencies/${created.json.data.id}`, { name: `Agency ${stamp}`, presence: 'made-up' })
  const after = (await visitor.get('/agencies')).json.data
  assert.equal(after.find((a) => a.name === `Agency ${stamp}`).presence, 'unconfirmed')
})

test('offices show their branch type only when it is stated', async () => {
  const agencyId = lookups.agencies[0].id
  const stated = await editor.post('/admin/offices', { agency_id: agencyId, name: `Branch ${stamp}`, branch_type: 'satellite', description: 'Near the market' })
  const plain = await editor.post('/admin/offices', { agency_id: agencyId, name: `Plain ${stamp}` })
  assert.equal(stated.status, 201, JSON.stringify(stated.json))
  assert.equal(plain.status, 201, JSON.stringify(plain.json))

  const offices = (await visitor.get('/offices')).json.data
  const branch = offices.find((o) => o.name === `Branch ${stamp}`)
  assert.equal(branch.branch_type, 'satellite')
  assert.equal(branch.description, 'Near the market')
  assert.equal(offices.find((o) => o.name === `Plain ${stamp}`).branch_type, null)
})
