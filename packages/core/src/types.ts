export type PlanType = 'stacjonarne' | 'niestacjonarne'
export type Day = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN'
export type ViewMode = 'cohort' | 'teacher' | 'room'

export interface ScheduleBlock {
  id: string
  subject: string
  planType: PlanType
  activity?: string
  teacher?: string
  teacherDisplay?: string
  sharedTeaching?: { teachers?: string[]; [key: string]: unknown }
  cohort?: string
  additionalCohorts?: string[]
  day?: Day | null
  date?: string | null
  start?: number | null
  duration?: number
  room?: string | null
  campus?: string | null
  modality?: string
  notes?: string
  period?: string
  teachingWeekParity?: number | null
  allowedWeekends?: string[]
  occurrenceWeekends?: string[]
  suggestedRooms?: string[]
  suggestedTimes?: Array<{ day: Day; start: number }>
  studentGrouping?: { kind?: string; group?: number; [key: string]: unknown }
  nsMixedLanguageGroups?: { languageGroup?: unknown; roots?: Record<string, unknown> }
  nsEnrollment?: { kind?: string; label?: string; count?: number; [key: string]: unknown }
  [key: string]: unknown
}

export interface ScheduleRoom {
  code: string
  name?: string
  campus?: string
  active?: boolean
  [key: string]: unknown
}

export interface ScheduleState {
  blocks: ScheduleBlock[]
  rooms: ScheduleRoom[]
  publicationMode?: 'ST' | 'NS'
  publicationStatus?: string
  publicationNotice?: string
  academicCalendar?: unknown
  snapshot?: { savedAt?: string; [key: string]: unknown }
  [key: string]: unknown
}

export interface ScheduleConflict {
  id?: string
  type?: string
  severity?: string
  message?: string
  blockIds?: string[]
  [key: string]: unknown
}

export interface ScheduleValidation {
  conflicts: ScheduleConflict[]
  wishReport?: Record<string, unknown>
  summary?: Record<string, unknown>
  [key: string]: unknown
}

export interface TimetableNotices {
  notices: unknown[]
  publicAlerts?: Array<{ planType?: PlanType; date?: string; expiresAfter?: string; title?: string; text?: string; items?: string[] }>
  [key: string]: unknown
}

export interface SchedulePayload {
  state: ScheduleState
  validation: ScheduleValidation
  timetableNotices?: TimetableNotices
  reviewRevision?: string | null
  [key: string]: unknown
}

export interface ScheduleEntry {
  id: string
  title: string
}
