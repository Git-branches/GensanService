import test from 'node:test'
import assert from 'node:assert/strict'
import { groupHours, openStatus, parseWeeklyHours } from './hours.js'

// Instants are written in UTC; openStatus reads them in Asia/Manila (UTC+8).
const mondayOnly = { 1: ['08:00', '17:00'] }

test('a Saturday visitor sees Monday as two days away, not tomorrow', () => {
  const saturdayEvening = new Date('2026-11-07T10:00:00Z') // Sat 18:00 Manila
  assert.deepEqual(openStatus(mondayOnly, saturdayEvening), {
    open: false,
    opens: '08:00',
    daysAhead: 2,
    weekday: 1,
  })
})

test('a Sunday visitor sees Monday as tomorrow', () => {
  const sundayEvening = new Date('2026-11-08T10:00:00Z') // Sun 18:00 Manila
  assert.deepEqual(openStatus(mondayOnly, sundayEvening), {
    open: false,
    opens: '08:00',
    daysAhead: 1,
    weekday: 1,
  })
})

test('before opening on the same day is later today', () => {
  const mondayMorning = new Date('2026-11-08T23:00:00Z') // Mon 07:00 Manila
  assert.deepEqual(openStatus(mondayOnly, mondayMorning), {
    open: false,
    opens: '08:00',
    daysAhead: 0,
    weekday: 1,
  })
})

test('during opening hours reports when it closes', () => {
  const mondayNoon = new Date('2026-11-09T04:00:00Z') // Mon 12:00 Manila
  assert.deepEqual(openStatus(mondayOnly, mondayNoon), { open: true, closes: '17:00' })
})

test('no weekly hours means no status', () => {
  assert.equal(openStatus({}, new Date('2026-11-09T04:00:00Z')), null)
})

test('weekly hours parsing rejects bad values', () => {
  assert.deepEqual(parseWeeklyHours('{"1":["08:00","17:00"],"2":["09:00","08:00"]}'), {
    1: ['08:00', '17:00'],
  })
  assert.equal(parseWeeklyHours('not json'), null)
})

test('groupHours joins consecutive days with the same hours', () => {
  assert.deepEqual(
    groupHours({ 1: ['08:00', '17:00'], 2: ['08:00', '17:00'], 4: ['09:00', '12:00'] }),
    [
      { from: 1, to: 2, open: '08:00', close: '17:00' },
      { from: 4, to: 4, open: '09:00', close: '12:00' },
    ],
  )
})
