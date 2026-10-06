import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildSubjectCatalog,
  cohortDisplayText,
  exerciseGroupForLab,
  getCohortHierarchy,
  prefillScheduleSelections,
  resolveUserBlocks,
} from '../src/index.ts'

const cohort = (semester, group) =>
  `I stopień stac sem. ${semester}${group == null ? '' : ` / gr. ${group}`}`

const block = (semester, group, activity, id) => ({
  id,
  subject: 'Przedmiot',
  cohort: cohort(semester, group),
  activity,
  planType: 'stacjonarne',
})

test('offers only real GL/GK groups when exercise groups include language classes', () => {
  const blocks = [
    ...Array.from({ length: 6 }, (_, i) => block(3, i + 1, 'L', `lab-${i + 1}`)),
    ...Array.from({ length: 5 }, (_, i) => block(3, i + 1, 'C', `language-${i + 1}`)),
  ]

  const nodes = getCohortHierarchy({ blocks, rooms: [] }).fields.Informatyka['I stopień'][2]

  assert.deepEqual(nodes.map(node => node.groupNumber), [1, 2, 3, 4, 5, 6])
  assert.equal(nodes[0].value, 'I stopień stac sem. 3 / GL 1')
})

test('does not invent GL/GK groups for an exercise-only semester', () => {
  const blocks = [block(7, 1, 'C', 'exercise-1'), block(7, 2, 'C', 'exercise-2')]
  const nodes = getCohortHierarchy({ blocks, rooms: [] }).fields.Informatyka['I stopień'][4]

  assert.deepEqual(nodes.map(node => node.value), [cohort(7, 1), cohort(7, 2)])
})

test('does not fill gaps in laboratory group numbers', () => {
  const blocks = [block(1, 1, 'L', 'lab-1'), block(1, 4, 'L', 'lab-4')]
  const nodes = getCohortHierarchy({ blocks, rooms: [] }).fields.Informatyka['I stopień'][1]

  assert.deepEqual(nodes.map(node => node.groupNumber), [1, 4])
})

test('semester 1 GL4 belongs to GĆ1 in labels, defaults, and fallback schedule', () => {
  const blocks = [
    ...Array.from({ length: 6 }, (_, i) => block(1, i + 1, 'L', `lab-${i + 1}`)),
    ...Array.from({ length: 3 }, (_, i) => block(1, i + 1, 'C', `exercise-${i + 1}`)),
  ]
  const state = { blocks, rooms: [] }
  const nodes = getCohortHierarchy(state).fields.Informatyka['I stopień'][1]
  const catalog = buildSubjectCatalog(state, cohort(1))

  assert.equal(nodes.find(node => node.groupNumber === 4).sublabel, 'Lab GL 4 · Ćwiczenia C1')
  assert.equal(cohortDisplayText(blocks.find(item => item.id === 'exercise-1')), `${cohort(1)} / C1 (GL1+GL4)`)
  assert.equal(prefillScheduleSelections(catalog, 4).selectedGroups['Przedmiot:c'], 'exercise-1')
  assert.deepEqual(
    resolveUserBlocks(state, { cohort: `${cohort(1)} / GK 4`, planType: 'stacjonarne', selectedSubjects: {}, selectedGroups: {} }).map(item => item.id).sort(),
    ['exercise-1', 'lab-4'],
  )
})

test('semester 3 GL1 belongs to GĆ1', () => {
  assert.equal(exerciseGroupForLab(cohort(3), 1), 1)
  assert.equal(exerciseGroupForLab(cohort(3), 4), 2)
})
