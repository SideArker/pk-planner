import test from 'node:test'
import assert from 'node:assert/strict'
import { notificationEvents } from '../src/notificationEvents.ts'
import { parseRegistration } from '../src/notificationStore.ts'

const registration = {
  token: 'a'.repeat(40),
  reminders: true,
  countdown: true,
  registeredAt: Date.now(),
  blocks: [{
    id: 'math-1', subject: 'Matematyka', day: 'TUE', start: 600,
    duration: 90, teachingWeekParity: 1,
  }],
}

test('Warsaw class sends a reminder, updates countdown, and ends it', () => {
  const before = notificationEvents(registration, new Date('2026-10-06T07:30:00Z'))
  assert.equal(before.length, 1)
  assert.match(before[0].title, /Za 30 minut/)

  const start = notificationEvents(registration, new Date('2026-10-06T08:00:00Z'))
  assert.equal(start.length, 1)
  assert.equal(start[0].body, 'Do końca 90 min')
  assert.equal(start[0].sticky, true)

  const update = notificationEvents(registration, new Date('2026-10-06T08:05:00Z'))
  assert.equal(update[0].body, 'Do końca 85 min')
  assert.equal(update[0].tag, start[0].tag)

  const end = notificationEvents(registration, new Date('2026-10-06T09:30:00Z'))
  assert.equal(end.length, 1)
  assert.equal(end[0].tag, start[0].tag)
  assert.equal(end[0].sticky, false)
})

test('week parity and dated weekend restrict delivery', () => {
  const wrongParity = { ...registration, blocks: [{ ...registration.blocks[0], teachingWeekParity: 0 }] }
  assert.deepEqual(notificationEvents(wrongParity, new Date('2026-10-06T07:30:00Z')), [])

  const weekend = {
    ...registration,
    blocks: [{
      id: 'lab', subject: 'Lab', day: 'SAT', start: 600, duration: 90,
      occurrenceWeekends: ['2026-10-10_2026-10-11'],
    }],
  }
  assert.equal(notificationEvents(weekend, new Date('2026-10-10T07:30:00Z')).length, 1)
  assert.equal(notificationEvents(weekend, new Date('2026-10-17T07:30:00Z')).length, 0)
})

test('registration rejects malformed blocks', () => {
  assert.ok(parseRegistration(registration))
  assert.equal(parseRegistration({ ...registration, blocks: [{ ...registration.blocks[0], start: 1440 }] }), null)
  assert.equal(parseRegistration({ ...registration, token: 'short' }), null)
})
