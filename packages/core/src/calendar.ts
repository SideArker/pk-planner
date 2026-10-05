import type { Day, ScheduleBlock } from './types.ts'
import { roomLabel, teacherDisplay } from './utils.ts'

const DAY_OFFSETS: Record<Day, number> = {
  MON: 0,
  TUE: 1,
  WED: 2,
  THU: 3,
  FRI: 4,
  SAT: 5,
  SUN: 6,
}

const ICAL_DAY_MAP: Record<Day, string> = {
  MON: 'MO',
  TUE: 'TU',
  WED: 'WE',
  THU: 'TH',
  FRI: 'FR',
  SAT: 'SA',
  SUN: 'SU',
}

function pad(num: number): string {
  return String(num).padStart(2, '0')
}

function formatIcsDateTime(date: Date): string {
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}00Z`
}

/**
 * Returns next date matching day of week starting from a reference Monday.
 */
function getTargetDate(mondayRef: Date, day: Day): Date {
  const date = new Date(mondayRef)
  date.setDate(mondayRef.getDate() + DAY_OFFSETS[day])
  return date
}

/**
 * Generates a direct Google Calendar web URL to add an event.
 */
export function getGoogleCalendarUrl(
  block: ScheduleBlock,
  referenceDate = new Date(),
): string {
  if (!block.day || block.start == null) return ''

  // Find Monday of current week
  const monday = new Date(referenceDate)
  const currentDayOfWeek = (monday.getDay() + 6) % 7 // Monday = 0
  monday.setDate(monday.getDate() - currentDayOfWeek)

  const eventDate = getTargetDate(monday, block.day)
  const startHour = Math.floor(block.start / 60)
  const startMinute = block.start % 60
  const duration = block.duration || 90
  const endMinutes = block.start + duration
  const endHour = Math.floor(endMinutes / 60)
  const endMinute = endMinutes % 60

  const year = eventDate.getFullYear()
  const month = pad(eventDate.getMonth() + 1)
  const dayStr = pad(eventDate.getDate())

  const startFormatted = `${year}${month}${dayStr}T${pad(startHour)}${pad(startMinute)}00`
  const endFormatted = `${year}${month}${dayStr}T${pad(endHour)}${pad(endMinute)}00`

  const title = encodeURIComponent(
    `${block.subject || 'Zajęcia'}${block.activity ? ` (${block.activity})` : ''}`,
  )
  const details = encodeURIComponent(
    `Wykładowca: ${teacherDisplay(block) || 'brak'}\nGrupa: ${block.cohort || 'brak'}\n${block.notes || ''}`,
  )
  const location = encodeURIComponent(
    block.room ? `Sala ${roomLabel(block.room)} (${block.campus || ''})` : 'Zdalnie / brak sali',
  )

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startFormatted}/${endFormatted}&details=${details}&location=${location}&recur=RRULE:FREQ=WEEKLY;UNTIL=20260215T235959Z`
}

export interface IcsExportOptions {
  calendarName?: string
  semesterEndDate?: Date // default to end of semester
  referenceMonday?: Date
}

/**
 * Generates standard RFC 5545 iCalendar (.ics) string for given blocks.
 */
export function generateIcs(
  blocks: ScheduleBlock[],
  options: IcsExportOptions = {},
): string {
  const calendarName = options.calendarName || 'PK Planer'
  const now = new Date()
  const nowFormatted = formatIcsDateTime(now)

  // Current or upcoming Monday
  const monday = new Date(options.referenceMonday || now)
  const dayOfWeek = (monday.getDay() + 6) % 7
  monday.setDate(monday.getDate() - dayOfWeek)
  monday.setHours(0, 0, 0, 0)

  // Default semester end: 15 weeks from now or specified
  const semesterEnd = options.semesterEndDate || new Date(monday.getTime() + 15 * 7 * 86400 * 1000)
  const untilFormatted = `${semesterEnd.getUTCFullYear()}${pad(semesterEnd.getUTCMonth() + 1)}${pad(semesterEnd.getUTCDate())}T235959Z`

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PK Planner//PL',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${calendarName}`,
    'X-WR-TIMEZONE:Europe/Warsaw',
  ]

  for (const block of blocks) {
    if (!block.day || block.start == null) continue

    const eventDate = getTargetDate(monday, block.day)
    const startHour = Math.floor(block.start / 60)
    const startMinute = block.start % 60
    const duration = block.duration || 90
    const endMinutes = block.start + duration
    const endHour = Math.floor(endMinutes / 60)
    const endMinute = endMinutes % 60

    eventDate.setHours(startHour, startMinute, 0, 0)
    const startDateUtc = formatIcsDateTime(eventDate)

    const endDate = new Date(eventDate)
    endDate.setHours(endHour, endMinute, 0, 0)
    const endDateUtc = formatIcsDateTime(endDate)

    const summary = `${block.subject || 'Zajęcia'}${block.activity ? ` (${block.activity})` : ''}`
    const location = block.room
      ? `Sala ${roomLabel(block.room)} (${block.campus || ''})`
      : block.modality === 'online' ? 'Online' : ''
    const description = [
      `Prowadzący: ${teacherDisplay(block) || 'brak'}`,
      `Grupa: ${block.cohort || 'brak'}`,
      block.notes ? `Uwagi: ${block.notes}` : '',
    ].filter(Boolean).join('\\n')

    const rruleDay = ICAL_DAY_MAP[block.day] || 'MO'
    let rrule = `RRULE:FREQ=WEEKLY;BYDAY=${rruleDay};UNTIL=${untilFormatted}`

    // Frequency parity (every 2 weeks)
    if (block.frequency === 'co_2_tygodnie' || block.teachingWeekParity != null) {
      rrule = `RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=${rruleDay};UNTIL=${untilFormatted}`
    }

    lines.push(
      'BEGIN:VEVENT',
      `UID:${block.id}@pk-planner`,
      `DTSTAMP:${nowFormatted}`,
      `DTSTART:${startDateUtc}`,
      `DTEND:${endDateUtc}`,
      `SUMMARY:${summary}`,
      location ? `LOCATION:${location}` : '',
      description ? `DESCRIPTION:${description}` : '',
      rrule,
      'END:VEVENT',
    )
  }

  lines.push('END:VCALENDAR')
  return lines.filter(Boolean).join('\r\n')
}
