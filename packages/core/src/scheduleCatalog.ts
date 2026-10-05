import type {
  PlanType,
  ScheduleBlock,
  ScheduleState,
  SubjectActivity,
  SubjectActivityOption,
  SubjectCatalogItem,
  UserScheduleConfig,
} from './types.ts'
import { blockCohorts, cohortParts, roomCampus, teacherDisplay } from './utils.ts'

export const NOT_APPLICABLE_VALUE = '__not_applicable'
export const NOT_APPLICABLE_LABEL = '<NIE DOTYCZY>'

export const ACTIVITY_LABELS: Record<string, string> = {
  w: 'Wykład',
  c: 'Ćwiczenia',
  cw: 'Ćwiczenia',
  cwiczenia: 'Ćwiczenia',
  l: 'Laboratorium',
  lab: 'Laboratorium',
  p: 'Projekt',
  proj: 'Projekt',
  s: 'Seminarium',
  sem: 'Seminarium',
  wf: 'Wychowanie fizyczne',
}

export function formatActivityName(activity?: string): string {
  if (!activity) return 'Zajęcia'
  const key = activity.toLowerCase().trim()
  return ACTIVITY_LABELS[key] || activity.toUpperCase()
}

export type FieldOfStudy = 'Informatyka' | 'Cyberpsychologia'
export type Degree = 'I stopień' | 'II stopień'

export interface CohortHierarchyNode {
  value: string
  label: string
  field: FieldOfStudy
  degree: Degree
  year: number
  semester: number
  planType: PlanType
}

export function parseCohortMetadata(
  cohortString: string,
  planType: PlanType = 'stacjonarne',
): CohortHierarchyNode {
  const norm = cohortString.toLowerCase()
  const isCyber = norm.includes('cyberpsychologia')
  const field: FieldOfStudy = isCyber ? 'Cyberpsychologia' : 'Informatyka'

  const isSecond = norm.includes('ii stopien') || norm.includes('ii stopień')
  const degree: Degree = isSecond ? 'II stopień' : 'I stopień'

  const semMatch = norm.match(/sem\.?\s*(\d+)/i)
  const semester = semMatch ? Number(semMatch[1]) : 1
  const year = Math.max(1, Math.ceil(semester / 2))

  const cleanLabel = cohortString.replace(/[—–]/g, '-').trim()

  return {
    value: cohortString,
    label: cleanLabel,
    field,
    degree,
    year,
    semester,
    planType,
  }
}

/**
 * Extracts unique base cohorts (degree + sem) from schedule state.
 */
export function extractUniqueCohorts(
  state: ScheduleState,
): Array<{ value: string; label: string; planType: PlanType }> {
  const map = new Map<string, { value: string; label: string; planType: PlanType }>()

  for (const block of state.blocks) {
    if (!block.cohort) continue
    for (const cohort of blockCohorts(block)) {
      const part = cohortParts(cohort)
      const base = part.base.trim()
      if (!base) continue

      if (!map.has(base)) {
        map.set(base, {
          value: base,
          label: base.replace(/[—–]/g, '-'),
          planType: block.planType,
        })
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label, 'pl'))
}

export function getCohortHierarchy(state: ScheduleState): {
  fields: Record<FieldOfStudy, Record<Degree, Record<number, CohortHierarchyNode[]>>>
  allNodes: CohortHierarchyNode[]
} {
  const baseCohorts = extractUniqueCohorts(state)
  const allNodes = baseCohorts.map(c => parseCohortMetadata(c.value, c.planType))

  const fields: Record<FieldOfStudy, Record<Degree, Record<number, CohortHierarchyNode[]>>> = {
    Informatyka: {
      'I stopień': {},
      'II stopień': {},
    },
    Cyberpsychologia: {
      'I stopień': {},
      'II stopień': {},
    },
  }

  for (const node of allNodes) {
    const degMap = fields[node.field][node.degree]
    if (!degMap[node.year]) {
      degMap[node.year] = []
    }
    degMap[node.year].push(node)
  }

  return { fields, allNodes }
}

/**
 * Checks if a block belongs to the selected cohort base.
 */
export function blockMatchesBaseCohort(block: ScheduleBlock, cohortBase: string): boolean {
  const target = cohortBase.toLowerCase().trim()
  const cohorts = blockCohorts(block)
  return cohorts.some(c => {
    const part = cohortParts(c)
    return part.base.toLowerCase().trim() === target
  })
}

/**
 * Extracts unique subjects and all their activity options (groups/teachers/times)
 * for a specified cohort base.
 */
export function buildSubjectCatalog(
  state: ScheduleState,
  cohortBase: string,
): SubjectCatalogItem[] {
  const matchingBlocks = state.blocks.filter(b => blockMatchesBaseCohort(b, cohortBase))
  const subjectMap = new Map<string, Map<string, SubjectActivityOption[]>>()

  for (const block of matchingBlocks) {
    const subject = (block.subject || 'Bez nazwy').trim()
    const activityKey = (block.activity || 'INNE').toLowerCase().trim()

    if (!subjectMap.has(subject)) {
      subjectMap.set(subject, new Map())
    }
    const actMap = subjectMap.get(subject)!
    if (!actMap.has(activityKey)) {
      actMap.set(activityKey, [])
    }

    const { group } = cohortParts(block.cohort)
    const groupLabel = group !== null ? `Grupa ${group}` : (block.cohort || 'Wszyscy')
    const teacher = teacherDisplay(block) || 'Nieprzypisany'
    const campus = roomCampus(block, state.rooms)

    actMap.get(activityKey)!.push({
      id: block.id,
      cohort: block.cohort || cohortBase,
      group: groupLabel,
      teacher,
      day: block.day ?? null,
      start: block.start ?? null,
      duration: block.duration || 90,
      room: block.room || null,
      campus,
      parity: block.teachingWeekParity ?? null,
    })
  }

  const items: SubjectCatalogItem[] = []

  for (const [subject, actMap] of subjectMap.entries()) {
    const activities: SubjectActivity[] = []
    for (const [activityKey, rawOptions] of actMap.entries()) {
      // Deduplicate options by group and day/start
      const seen = new Set<string>()
      const options: SubjectActivityOption[] = []
      for (const opt of rawOptions) {
        const key = `${opt.group}-${opt.day}-${opt.start}-${opt.room}`
        if (!seen.has(key)) {
          seen.add(key)
          options.push(opt)
        }
      }

      options.sort((a, b) => a.group.localeCompare(b.group, 'pl', { numeric: true }))

      activities.push({
        activity: activityKey,
        activityLabel: formatActivityName(activityKey),
        options,
      })
    }

    activities.sort((a, b) => a.activityLabel.localeCompare(b.activityLabel, 'pl'))
    items.push({ subject, activities })
  }

  return items.sort((a, b) => a.subject.localeCompare(b.subject, 'pl'))
}

/**
 * Resolves user schedule blocks based on config, chosen groups, and overrides.
 */
export function resolveUserBlocks(
  state: ScheduleState,
  config: UserScheduleConfig,
): ScheduleBlock[] {
  if (!config.cohort) return []

  const cohortBase = config.cohort.toLowerCase().trim()
  const matchingBlocks = state.blocks.filter(b => blockMatchesBaseCohort(b, cohortBase))

  const results: ScheduleBlock[] = []

  for (const block of matchingBlocks) {
    const subject = (block.subject || 'Bez nazwy').trim()
    // If user explicitly excluded this subject
    if (config.selectedSubjects && config.selectedSubjects[subject] === false) {
      continue
    }

    const activityKey = (block.activity || 'INNE').toLowerCase().trim()
    const selectionKey = `${subject}:${activityKey}`
    const chosenGroupOrId = config.selectedGroups?.[selectionKey]

    // If marked as NOT APPLICABLE (<NIE DOTYCZY>)
    if (
      chosenGroupOrId === NOT_APPLICABLE_VALUE ||
      chosenGroupOrId === NOT_APPLICABLE_LABEL ||
      chosenGroupOrId === '__none'
    ) {
      continue
    }

    // If user made an explicit selection for this activity:
    if (chosenGroupOrId) {
      const { group } = cohortParts(block.cohort)
      const groupString = group !== null ? `Grupa ${group}` : (block.cohort || 'Wszyscy')

      // Matches either direct block ID or group label
      const isSelected =
        block.id === chosenGroupOrId ||
        groupString === chosenGroupOrId ||
        String(group) === chosenGroupOrId

      if (!isSelected) {
        continue
      }
    }

    // Check custom overrides
    const override = config.overrides?.[block.id]
    if (override?.hidden) {
      continue
    }

    if (override) {
      results.push({
        ...block,
        subject: override.customSubject || block.subject,
        teacher: override.customTeacher || block.teacher,
        teacherDisplay: override.customTeacher || block.teacherDisplay,
        room: override.customRoom !== undefined ? override.customRoom : block.room,
        notes: override.customNotes !== undefined ? override.customNotes : block.notes,
      })
    } else {
      results.push(block)
    }
  }

  return results
}

/**
 * Finds alternative groups for the same subject and activity within the cohort.
 */
export function findAlternativeGroups(
  state: ScheduleState,
  currentBlock: ScheduleBlock,
  cohortBase?: string,
): SubjectActivityOption[] {
  const base = cohortBase || cohortParts(currentBlock.cohort).base
  const subject = (currentBlock.subject || '').trim()
  const activityKey = (currentBlock.activity || 'INNE').toLowerCase().trim()

  const sameSubjects = state.blocks.filter(b => {
    if ((b.subject || '').trim() !== subject) return false
    if ((b.activity || 'INNE').toLowerCase().trim() !== activityKey) return false
    return blockMatchesBaseCohort(b, base)
  })

  const seen = new Set<string>()
  const options: SubjectActivityOption[] = []

  for (const b of sameSubjects) {
    const { group } = cohortParts(b.cohort)
    const groupLabel = group !== null ? `Grupa ${group}` : (b.cohort || 'Wszyscy')
    const key = `${groupLabel}-${b.day}-${b.start}-${b.room}`
    if (!seen.has(key)) {
      seen.add(key)
      options.push({
        id: b.id,
        cohort: b.cohort || base,
        group: groupLabel,
        teacher: teacherDisplay(b) || 'Nieprzypisany',
        day: b.day ?? null,
        start: b.start ?? null,
        duration: b.duration || 90,
        room: b.room || null,
        campus: roomCampus(b, state.rooms),
        parity: b.teachingWeekParity ?? null,
      })
    }
  }

  return options.sort((a, b) => a.group.localeCompare(b.group, 'pl', { numeric: true }))
}
