import type { Day, PlanType, ScheduleBlock, ScheduleState, ViewMode } from './types'
import { blockCohorts, cohortParts, cohortScopeValue, curriculumParts, mappedCohortParts, plain,
  reservationTeachers, roomCampus, roomLabel, teacherDisplay } from './utils'

export const ALL = '__all'

export interface ScheduleSelection {
  planType: PlanType
  viewMode: ViewMode
  entity?: string
  search?: string
  roomCampus?: string
  weekend?: string | null
  nsTimeline?: boolean
  includeUnassignedRoom?: boolean
}

export function availableDays(planType: PlanType): Day[] {
  return planType === 'niestacjonarne' ? ['SAT', 'SUN'] : ['MON', 'TUE', 'WED', 'THU', 'FRI']
}

export function isPlaced(block: ScheduleBlock): boolean {
  return Boolean(block.day) && block.start != null
}

export function matchesWeekend(block: ScheduleBlock, weekend?: string | null): boolean {
  if (block.planType !== 'niestacjonarne' || !weekend || weekend === ALL) return true
  if (block.date) return weekend.split('_').includes(block.date)
  if (block.allowedWeekends?.length) return block.allowedWeekends.includes(weekend)
  if (block.occurrenceWeekends?.length) return block.occurrenceWeekends.includes(weekend)
  return true
}

function studentGroupActivity(block: ScheduleBlock): string {
  if (block.planType === 'niestacjonarne' && block.subject === 'Wprowadzenie do studiowania'
    && block.teacher === 'Grzonka Daniel') return 'c'
  return plain(block.activity)
}

export function matchesCohort(block: ScheduleBlock, entity: string): boolean {
  if (entity === ALL) return true
  if (block.nsMixedLanguageGroups?.languageGroup) {
    const root = plain(entity).match(/^ii stopien niestac sem\. \d+/)?.[0]
    return Object.keys(block.nsMixedLanguageGroups.roots || {}).includes(root || plain(curriculumParts(entity).curriculum))
  }
  const selected = curriculumParts(entity)
  return blockCohorts(block).some(cohort => {
    const current = mappedCohortParts(cohort)
    if (selected.curriculum !== current.curriculum) return false
    if (selected.specialty && current.specialty && selected.specialty !== current.specialty) return false
    if (selected.elective && current.elective && selected.elective !== current.elective) return false
    if (block.studentGrouping?.kind === 'mixed_language') return true
    if (selected.group === null || current.group === null) return true
    const mappedCal = /^II stopień niestac sem\./i.test(current.base) && /\bCAL\b/i.test(current.base)
    const paired = ['c', 'cw', 'cwiczenia'].includes(studentGroupActivity(block)) && !mappedCal
    return paired ? [2 * current.group - 1, 2 * current.group].includes(selected.group) : current.group === selected.group
  })
}

export function matchesEntity(block: ScheduleBlock, viewMode: ViewMode, entity: string): boolean {
  if (entity === ALL) return true
  if (viewMode === 'teacher') return reservationTeachers(block).includes(entity)
  if (viewMode === 'room') return (block.room || 'Bez sali') === entity
  return matchesCohort(block, entity)
}

export function matchesSearch(block: ScheduleBlock, search: string): boolean {
  const needle = search.trim().toLocaleLowerCase('pl')
  if (!needle) return true
  return [block.subject, teacherDisplay(block), ...reservationTeachers(block), ...blockCohorts(block),
    roomLabel(block.room), block.notes].filter(Boolean).join(' ').toLocaleLowerCase('pl').includes(needle)
}

export function matchesScheduleScope(block: ScheduleBlock, state: ScheduleState, selection: ScheduleSelection): boolean {
  if (block.planType !== selection.planType) return false
  if (!selection.nsTimeline && !matchesWeekend(block, selection.weekend)) return false
  if (!matchesSearch(block, selection.search || '')) return false
  const campus = roomCampus(block, state.rooms)
  if (selection.planType === 'niestacjonarne' && (campus === 'Lea' || /^LEA(?:$|[- ])/.test(String(block.room).toUpperCase()))) return false
  if (selection.viewMode === 'room' && selection.roomCampus && selection.roomCampus !== ALL
    && (!block.room || campus !== selection.roomCampus)) return false
  const entity = selection.entity || ALL
  if (selection.viewMode === 'room' && selection.includeUnassignedRoom !== false && !block.room) return true
  return matchesEntity(block, selection.viewMode, entity)
}

export function visibleBlocks(state: ScheduleState, selection: ScheduleSelection): ScheduleBlock[] {
  return state.blocks.filter(block => isPlaced(block) && matchesScheduleScope(block, state, selection))
}

export function weekendKeys(state: ScheduleState): string[] {
  const keys = new Set<string>()
  for (const block of state.blocks) {
    for (const key of [...(block.occurrenceWeekends || []), ...(block.allowedWeekends || [])]) keys.add(key)
  }
  return [...keys].filter(key => /^\d{4}-\d{2}-\d{2}_\d{4}-\d{2}-\d{2}$/.test(key)).sort()
}

export function cohortOptions(state: ScheduleState, planType: PlanType): string[] {
  const values = new Set<string>()
  for (const block of state.blocks.filter(block => block.planType === planType)) {
    for (const cohort of blockCohorts(block)) {
      const part = curriculumParts(cohort)
      values.add(part.curriculum)
      values.add(cohortScopeValue(cohort, false))
      if (part.group !== null && block.studentGrouping?.kind !== 'mixed_language') values.add(cohortScopeValue(cohort, true))
      const mapped = mappedCohortParts(cohort)
      if (mapped.specialty) {
        const base = `${mapped.curriculum} ${mapped.specialty}`
        values.add(base)
        if (mapped.group !== null) values.add(`${base} / gr. ${mapped.group}`)
      }
    }
  }
  return [...values].filter(Boolean).sort((a, b) => a.localeCompare(b, 'pl'))
}

export function cohortStudentGroups(block: ScheduleBlock, cohort = block.cohort): number[] | null {
  if (block.nsMixedLanguageGroups?.languageGroup || block.studentGrouping?.kind === 'mixed_language') return null
  const { group } = cohortParts(cohort)
  if (group === null) return null
  return ['c', 'cw', 'cwiczenia'].includes(studentGroupActivity(block))
    ? [2 * group - 1, 2 * group] : [group]
}
