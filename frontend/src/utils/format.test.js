import test from 'node:test'
import assert from 'node:assert/strict'
import { formatDate } from './format.js'

const month = { month: 'long' }

test('English dates use English month names', () => {
  assert.equal(formatDate('2026-11-05', month, 'en'), 'November')
})

test('Cebuano and Hiligaynon use Filipino month names', () => {
  assert.equal(formatDate('2026-11-05', month, 'ceb'), 'Nobyembre')
  assert.equal(formatDate('2026-11-05', month, 'hil'), 'Nobyembre')
})

test('an unknown language falls back to English', () => {
  assert.equal(formatDate('2026-11-05', month, 'xx'), 'November')
})

test('empty and invalid values stay empty', () => {
  assert.equal(formatDate(''), '')
  assert.equal(formatDate('not a date'), '')
})
