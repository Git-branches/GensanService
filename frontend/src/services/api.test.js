import test, { beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import {
  clearApiCache,
  getAgencies,
  getCategories,
  getServices,
  reportIssue,
} from './api.js'

const realFetch = globalThis.fetch
let calls

function ok(data) {
  return { ok: true, status: 200, json: async () => ({ success: true, data }) }
}

function fail(message, status = 500) {
  return { ok: false, status, json: async () => ({ success: false, error: message }) }
}

function calledPaths() {
  return calls.map(([url]) => url)
}

beforeEach(() => {
  clearApiCache()
  calls = []
  globalThis.fetch = async (url, options) => {
    calls.push([url, options])
    return ok({ url })
  }
})

afterEach(() => {
  globalThis.fetch = realFetch
  clearApiCache()
})

test('a repeated read is served from the cache', async () => {
  await getCategories()
  await getCategories()

  assert.equal(calls.length, 1)
})

test('reads that happen at the same time share one request', async () => {
  const [first, second] = await Promise.all([getAgencies(), getAgencies()])

  assert.equal(calls.length, 1)
  assert.deepEqual(first, second)
})

test('different paths and query strings are cached separately', async () => {
  await getServices()
  await getServices({ category: 'health' })
  await getServices({ sort: 'recent', limit: 4 })

  assert.deepEqual(calledPaths(), [
    '/api/services',
    '/api/services?category=health',
    '/api/services?sort=recent&limit=4',
  ])
})

test('writes are never cached', async () => {
  await reportIssue('birth-certificate', { issue: 'outdated' })
  await reportIssue('birth-certificate', { issue: 'outdated' })

  assert.equal(calls.length, 2)
  assert.ok(calls.every(([, options]) => options.method === 'POST'))
})

test('a failed read is not cached and is retried', async () => {
  globalThis.fetch = async () => fail('Service unavailable', 503)

  await assert.rejects(getCategories(), /Service unavailable/)

  globalThis.fetch = async (url) => {
    calls.push([url])
    return ok(['retried'])
  }

  assert.deepEqual(await getCategories(), ['retried'])
  assert.equal(calls.length, 1)
})
