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
  isCustom?: boolean
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

export interface BlockOverride {
  customSubject?: string
  customTeacher?: string
  customRoom?: string
  customNotes?: string
  hidden?: boolean
}

export interface UserScheduleConfig {
  cohort: string
  planType: PlanType
  selectedSubjects: Record<string, boolean> // subjectName -> boolean
  selectedGroups: Record<string, string> // e.g. "subjectName:activity" -> optionId or group string
  overrides?: Record<string, BlockOverride> // blockId -> custom override
  customBlocks?: ScheduleBlock[] // user added custom blocks
  theme?: 'light' | 'dark' | 'system'
}

export interface SubjectActivityOption {
  id: string
  cohort: string
  group: string
  teacher: string
  day: Day | null
  start: number | null
  duration: number
  room: string | null
  campus: string | null
  parity?: number | null
}

export interface SubjectActivity {
  activity: string
  activityLabel: string
  options: SubjectActivityOption[]
}

export interface SubjectCatalogItem {
  subject: string
  activities: SubjectActivity[]
}

