import test from 'node:test'
import assert from 'node:assert/strict'
import {
  parseSchedulePayload, importedNotices, mappedCohortParts, matchesCohort,
  matchesWeekend, roomCampus, suggestedTimeSlots, visibleBlocks, cohortDisplayText, weekendKeys,
  extractUniqueCohorts, buildSubjectCatalog, resolveUserBlocks, generateIcs, getGoogleCalendarUrl,
  getCohortHierarchy,
} from '../src/index.ts'

const block = {
  id: 'b1', subject: 'Algorytmy', planType: 'stacjonarne', cohort: 'I stopień stac sem. 1 / gr. 1',
  activity: 'C', teacher: 'Anna', day: 'MON', start: 480, duration: 90, room: 'L1',
}
const state = { blocks: [block, { ...block, id: 'parked', day: null, start: null }], rooms: [{ code: 'L1', campus: 'Czyżyny' }] }

test('parses snapshot envelope without losing extra data', () => {
  const payload = parseSchedulePayload(JSON.stringify({ state, validation: { conflicts: [] },
    timetableNotices: { notices: [] }, custom: { keep: true } }))
  assert.equal(payload.custom.keep, true)
  assert.deepEqual(importedNotices(payload), { notices: [] })
  assert.equal(importedNotices(parseSchedulePayload({ state })), undefined)
  assert.throws(() => parseSchedulePayload({ state: { blocks: [{}], rooms: [] } }), /id i subject/)
})

test('maps CAL specialties and paired exercise groups', () => {
  assert.deepEqual(mappedCohortParts('II stopień niestac sem. 1 CAL / gr. 6').specialty, 'SIR')
  assert.equal(matchesCohort(block, 'I stopień stac sem. 1 / gr. 2'), true)
  assert.equal(matchesCohort(block, 'I stopień stac sem. 1 / gr. 3'), false)
  const cal = { ...block, planType: 'niestacjonarne', cohort: 'II stopień niestac sem. 1 CAL / gr. 3' }
  assert.equal(matchesCohort(cal, 'II stopień niestac sem. 1 CY / gr. 1'), true)
  assert.equal(matchesCohort(cal, 'II stopień niestac sem. 1 DS / gr. 1'), false)
})

test('keeps parked lessons in state but hides them from visible schedule', () => {
  assert.deepEqual(visibleBlocks(state, { planType: 'stacjonarne', viewMode: 'teacher', entity: 'Anna' }).map(b => b.id), ['b1'])
  assert.equal(roomCampus({ room: 'SEMINARYJNA' }), 'Czyżyny')
  assert.deepEqual(suggestedTimeSlots({ suggestedTimes: [
    { day: 'MON', start: 480 }, { day: 'MON', start: 480 }, { day: 'BAD', start: 480 },
  ] }), [{ day: 'MON', start: 480 }])
})

test('matches dated and recurring nonstationary weekends', () => {
  const weekend = '2026-10-10_2026-10-11'
  const ns = { ...block, planType: 'niestacjonarne' }
  assert.equal(matchesWeekend({ ...ns, date: '2026-10-11' }, weekend), true)
  assert.equal(matchesWeekend({ ...ns, date: '2026-10-18' }, weekend), false)
  assert.equal(matchesWeekend({ ...ns, allowedWeekends: [weekend] }, weekend), true)
  assert.equal(matchesWeekend({ ...ns, allowedWeekends: ['2026-10-17_2026-10-18'] }, weekend), false)
  assert.deepEqual(weekendKeys({ ...state, wishes: [{ payload: { parttime: { weekends: { [weekend]: {} } } } }] }), [weekend])
})

test('formats first-degree groups and joint classes', () => {
  assert.equal(cohortDisplayText(block), 'I stopień stac sem. 1 / C1 (GL1+GL2)')
  assert.match(cohortDisplayText({ ...block, additionalCohorts: ['I stopień stac sem. 3 / gr. 1'] }), /wspólnie z:/)
})

test('extracts cohorts, catalogs subjects and resolves user blocks', () => {
  const cohorts = extractUniqueCohorts(state)
  assert.equal(cohorts.length, 1)
  assert.equal(cohorts[0].value, 'I stopień stac sem. 1')

  const catalog = buildSubjectCatalog(state, 'I stopień stac sem. 1')
  assert.equal(catalog.length, 1)
  assert.equal(catalog[0].subject, 'Algorytmy')
  assert.equal(catalog[0].activities[0].options[0].group, 'Grupa 1')

  const resolved = resolveUserBlocks(state, {
    cohort: 'I stopień stac sem. 1',
    planType: 'stacjonarne',
    selectedSubjects: { Algorytmy: true },
    selectedGroups: { 'Algorytmy:c': 'b1' },
    overrides: { b1: { customSubject: 'Zaawansowane Algorytmy' } },
  })
  assert.equal(resolved.length, 1)
  assert.equal(resolved[0].subject, 'Zaawansowane Algorytmy')

  // Not applicable test
  const ignored = resolveUserBlocks(state, {
    cohort: 'I stopień stac sem. 1',
    planType: 'stacjonarne',
    selectedSubjects: { Algorytmy: true },
    selectedGroups: { 'Algorytmy:c': '__not_applicable' },
  })
  assert.equal(ignored.length, 0)
})

test('categorizes cohorts into hierarchy by field, degree and year', () => {
  const multiState = {
    blocks: [
      { id: '1', subject: 'A', cohort: 'I stopień stac sem. 1 / gr. 1', planType: 'stacjonarne' },
      { id: '2', subject: 'B', cohort: 'I stopień stac sem. 3 / gr. 1', planType: 'stacjonarne' },
      { id: '3', subject: 'C', cohort: 'Cyberpsychologia - I stopień stac. sem. 1 / gr. 1', planType: 'stacjonarne' },
      { id: '4', subject: 'D', cohort: 'II stopień stac sem. 2 CY / gr. 1', planType: 'stacjonarne' },
    ],
    rooms: [],
  }

  const { fields, allNodes } = getCohortHierarchy(multiState)
  assert.equal(allNodes.length, 4)
  assert.equal(fields.Informatyka['I stopień'][1].length, 1)
  assert.equal(fields.Informatyka['I stopień'][2].length, 1)
  assert.equal(fields.Informatyka['II stopień'][1].length, 1)
  assert.equal(fields.Cyberpsychologia['I stopień'][1].length, 1)
})

test('generates ics and google calendar urls', () => {
  const ics = generateIcs([block])
  assert.match(ics, /BEGIN:VCALENDAR/)
  assert.match(ics, /SUMMARY:Algorytmy \(C\)/)
  assert.match(ics, /END:VCALENDAR/)

  const gCal = getGoogleCalendarUrl(block)
  assert.match(gCal, /calendar\.google\.com\/calendar\/render/)
  assert.match(gCal, /Algorytmy/)
})


