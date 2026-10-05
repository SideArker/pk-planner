export const APP_NAME = 'PK Planner'

import type { Day, ScheduleBlock, ScheduleRoom } from './types'

export const DAY_INFO: Record<Day, readonly [string, string]> = {
  MON: ['Poniedziałek', 'pon.'], TUE: ['Wtorek', 'wt.'], WED: ['Środa', 'śr.'],
  THU: ['Czwartek', 'czw.'], FRI: ['Piątek', 'pt.'], SAT: ['Sobota', 'sob.'],
  SUN: ['Niedziela', 'niedz.'],
}

export function plain(value: unknown): string {
  return String(value ?? '').replaceAll('ł', 'l').replaceAll('Ł', 'L')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pl').trim()
}

export function minutesToTime(minutes: number | null | undefined): string {
  if (minutes == null || Number.isNaN(Number(minutes))) return ''
  const value = Math.max(0, Number(minutes))
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`
}

export function timeToMinutes(value: string): number | null {
  if (!/^\d{1,2}:\d{2}$/.test(value)) return null
  const [hour, minute] = value.split(':').map(Number)
  return hour < 24 && minute < 60 ? hour * 60 + minute : null
}

export function subjectTitle(block: ScheduleBlock): string {
  const activity = String(block.activity || '').trim().toUpperCase()
  return activity ? `${block.subject || 'Zajęcia'} — ${activity}` : block.subject || 'Zajęcia'
}

export function roomLabel(value: string | null | undefined): string {
  return String(value ?? '').replace(/\bSEMINARYJNA\b/gi, 'S1')
}

export function suggestedRoomCodes(block: Pick<ScheduleBlock, 'suggestedRooms'>): string[] {
  return [...new Set((Array.isArray(block.suggestedRooms) ? block.suggestedRooms : [])
    .filter(code => typeof code === 'string' && code.trim()).map(code => code.trim()))]
}

export function suggestedTimeSlots(block: Pick<ScheduleBlock, 'suggestedTimes'>): Array<{ day: Day; start: number }> {
  const seen = new Set<string>()
  return (Array.isArray(block.suggestedTimes) ? block.suggestedTimes : []).filter(slot => {
    if (!slot || !Object.hasOwn(DAY_INFO, slot.day) || !Number.isInteger(slot.start)
      || slot.start < 0 || slot.start >= 1440) return false
    const key = `${slot.day}:${slot.start}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }).map(({ day, start }) => ({ day, start }))
}

export function cohortParts(value: string | null | undefined): { base: string; group: number | null } {
  const text = String(value || '').trim().replace(/\s+/g, ' ')
  const match = text.match(/\s*\/\s*gr\.?\s*(\d+)\s*$/i)
  return match ? { base: text.slice(0, match.index).trim(), group: Number(match[1]) } : { base: text, group: null }
}

export function curriculumParts(value: string | null | undefined) {
  const part = cohortParts(value)
  const match = part.base.match(/^(I{1,2} stopień (?:nie)?stac sem\.) (\d+)(W\d*)?(?: (\S+))?$/i)
  if (!match) return { ...part, curriculum: part.base, specialty: null as string | null, elective: null as string | null }
  return { ...part, curriculum: `${match[1]} ${match[2]}`,
    specialty: match[4] && match[4] !== 'CAL' ? match[4] : null, elective: match[3] || null }
}

export function mappedCohortParts(value: string | null | undefined) {
  const part = curriculumParts(value)
  if (!/^II stopień niestac sem\./i.test(part.base) || !/\bCAL\b/i.test(part.base) || part.group === null) return part
  if (part.group >= 1 && part.group <= 2) return { ...part, specialty: 'DS', group: part.group }
  if (/^II stopień niestac sem\. 1 CAL$/i.test(part.base) && part.group === 6) return { ...part, specialty: 'SIR', group: 1 }
  if (part.group >= 3 && part.group <= 6) return { ...part, specialty: 'CY', group: part.group - 2 }
  return part
}

export function cohortScopeValue(value: string, includeGroup = true): string {
  const part = curriculumParts(value)
  const base = `${part.curriculum}${part.specialty ? ` ${part.specialty}` : ''}`
  return includeGroup && part.group !== null ? `${base} / gr. ${part.group}` : base
}

export function isFirstDegreeCohort(value: string): boolean {
  return /(?:^|\s)i stopien (?:nie)?stac\.? sem\./.test(plain(cohortParts(value).base))
}

export function cohortDisplayLabel(value: string, block?: ScheduleBlock): string {
  const part = curriculumParts(value)
  let groupLabel: string | null = null
  if (block?.nsEnrollment?.kind === 'roster' && block.nsEnrollment.label !== 'W') {
    groupLabel = `${block.nsEnrollment.label} (${block.nsEnrollment.count} osób)`
  } else if (block && isFirstDegreeCohort(value) && part.group !== null) {
    const activity = plain(block.activity)
    if (block.studentGrouping?.kind === 'mixed_language' || plain(block.subject).startsWith('jezyk obcy')) {
      groupLabel = `Grupa językowa ${block.studentGrouping?.group || part.group}`
    } else if (/sem\.?\s*\d+W\d*/i.test(part.base)) {
      groupLabel = `grupa obieralna ${part.group}`
    } else if (['c', 'cw', 'cwiczenia', 'ćw'].includes(activity)
      || (block.planType === 'niestacjonarne' && block.subject === 'Wprowadzenie do studiowania' && block.teacher === 'Grzonka Daniel')) {
      groupLabel = `C${part.group} (GL${2 * part.group - 1}+GL${2 * part.group})`
    } else if (['l', 'p', 'w'].includes(activity)) groupLabel = `GL${part.group}`
    else if (activity === 'wf') groupLabel = `grupa WF ${part.group}`
  }
  if (groupLabel) {
    const base = part.elective ? `${part.curriculum}${part.specialty ? ` ${part.specialty}` : ''} · wybór ${part.elective}` : part.base
    return `${base} / ${groupLabel}`
  }
  if (!part.elective) return value
  return `${part.curriculum}${part.specialty ? ` ${part.specialty}` : ''} · wybór ${part.elective}${part.group !== null ? ` / gr. ${part.group}` : ''}`
}

export function cohortDisplayText(block: ScheduleBlock): string {
  if (block.nsMixedLanguageGroups?.languageGroup) {
    return `Grupa językowa ${block.groupNo || cohortParts(block.cohort).group} · ${curriculumParts(block.cohort).curriculum} (mieszana — wszystkie specjalności/grupy rocznika)`
  }
  if (block.studentGrouping?.kind === 'mixed_language') {
    const values = blockCohorts(block).map(cohort => cohortScopeValue(cohort, false))
    return `Grupa językowa ${block.studentGrouping.group} · ${values.join(' + ')} (grupa mieszana)`
  }
  const values = blockCohorts(block).map(value => cohortDisplayLabel(value, block))
  return values.length > 1 ? `${values[0]} · wspólnie z: ${values.slice(1).join(', ')}` : (values[0] || '')
}

export function blockCohorts(block: ScheduleBlock): string[] {
  return [block.cohort, ...(block.additionalCohorts || [])]
    .filter((value): value is string => Boolean(value))
    .filter((value, index, values) => values.indexOf(value) === index)
}

export function reservationTeachers(block: ScheduleBlock): string[] {
  return block.sharedTeaching?.teachers?.length ? block.sharedTeaching.teachers : block.teacher ? [block.teacher] : []
}

export function teacherDisplay(block: ScheduleBlock): string {
  return block.teacherDisplay || block.teacher || ''
}

export function roomCampus(block: Pick<ScheduleBlock, 'room' | 'modality' | 'campus' | 'suggestedRooms'>,
  rooms: ScheduleRoom[] = []): string | null {
  const key = String(block.room || '').trim().toUpperCase()
  if (['L1', 'L2', 'L3', 'L4', 'L5', 'P1', 'W1', 'SEMINARYJNA'].includes(key)) return 'Czyżyny'
  if (['1/15', 'N', '114', '131', 'S2', 'S3', '303', '312', '152', '152 SJO', 'SJO 152'].includes(key)) return 'Warszawska'
  if (key === 'ONLINE' || block.modality === 'online') return 'Zdalnie'
  if (!key || key === 'TODO') {
    const campuses = new Set(suggestedRoomCodes(block).map(room => roomCampus({ room }, rooms)))
    return campuses.size === 1 && !campuses.has(null) ? [...campuses][0] : null
  }
  return rooms.find(room => room.code === block.room)?.campus || block.campus || null
}

export function blockPlacementText(block: ScheduleBlock): string {
  if (!block.day || block.start == null) return 'Parking — bez ustalonego terminu'
  const day = block.date || DAY_INFO[block.day]?.[0] || block.day
  const place = block.modality === 'online' ? 'ONLINE' : block.room ? `s. ${roomLabel(block.room)}` : 'bez sali'
  return `${day} ${minutesToTime(block.start)}–${minutesToTime(block.start + (block.duration || 90))} · ${place}`
}
