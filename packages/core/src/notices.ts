import type { PlanType, ScheduleBlock, TimetableNotices } from './types.ts'

interface NoticeMatch {
  planType?: string
  blockIds?: string[]
  subjects?: string[]
  activities?: string[]
  activity?: string
  cohort?: string
  teachers?: string[]
  groupsByActivity?: Record<string, number[]>
}

interface Notice {
  id?: string
  match?: NoticeMatch
  text?: string
  expiresAfter?: string
  requiredDay?: string
  otherDayText?: string
}

function matchesNotice(block: ScheduleBlock, match: NoticeMatch): boolean {
  if (match.planType && match.planType !== block.planType) return false
  if (match.blockIds && !match.blockIds.includes(block.id)) return false
  if (match.subjects && !match.subjects.includes(block.subject)) return false
  const activity = (block.activity || '').toUpperCase().replace('Ć', 'C')
  if (match.activity && match.activity.toUpperCase().replace('Ć', 'C') !== activity) return false
  if (match.activities && !match.activities.map(value => value.toUpperCase().replace('Ć', 'C')).includes(activity)) return false
  if (match.cohort && block.cohort !== match.cohort && !block.cohort?.startsWith(`${match.cohort} /`)) return false
  if (match.teachers && !match.teachers.includes(block.teacher || '')) return false
  const groups = match.groupsByActivity?.[activity]
  if (groups && !groups.includes(Number(block.groupNo ?? block.studentGrouping?.group ?? block.cohort?.match(/gr\.\s*(\d+)/i)?.[1]))) return false
  return true
}

export function getBlockNotices(block: ScheduleBlock, source?: TimetableNotices, today = new Date()): string[] {
  if (!source || block.isCustom) return []
  const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const entries = [...(source.notices || []), ...(Array.isArray(source.publicationNotes) ? source.publicationNotes : [])]
  return entries.flatMap(value => {
    if (!value || typeof value !== 'object') return []
    const notice = value as Notice
    if (!notice.match || typeof notice.text !== 'string' || !notice.text.trim()) return []
    if (notice.expiresAfter && notice.expiresAfter < date) return []
    if (!matchesNotice(block, notice.match)) return []
    const text = notice.requiredDay && notice.requiredDay !== block.day ? notice.otherDayText : notice.text
    return typeof text === 'string' && text.trim() ? [text.trim()] : []
  }).filter((text, index, all) => all.indexOf(text) === index)
}

export function getPublicAlerts(source: TimetableNotices | undefined, cohort: string, planType: PlanType, today = new Date()) {
  const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  return (source?.publicAlerts || []).filter(alert =>
    alert.planType === planType &&
    typeof alert.cohort === 'string' &&
    (cohort === alert.cohort || cohort.startsWith(`${alert.cohort} /`)) &&
    (!alert.date || alert.date <= date) &&
    (!alert.expiresAfter || alert.expiresAfter >= date) &&
    Boolean(alert.title || alert.text),
  )
}
