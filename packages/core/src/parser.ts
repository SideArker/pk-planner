import type { SchedulePayload, ScheduleState, TimetableNotices } from './types'

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function requireRecord(value: unknown, path: string): Record<string, unknown> {
  if (!record(value)) throw new TypeError(`${path}: oczekiwano obiektu`)
  return value
}

function requireArray(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) throw new TypeError(`${path}: oczekiwano tablicy`)
  return value
}

/** Parses the envelope read by app.js from /api/state (or a published snapshot). */
export function parseSchedulePayload(input: unknown): SchedulePayload {
  const payload = requireRecord(typeof input === 'string' ? JSON.parse(input) : input, 'payload')
  const state = requireRecord(payload.state, 'state')
  requireArray(state.blocks, 'state.blocks').forEach((value, index) => {
    const block = requireRecord(value, `state.blocks[${index}]`)
    if (typeof block.id !== 'string' || !block.id || typeof block.subject !== 'string') {
      throw new TypeError(`state.blocks[${index}]: wymagane są id i subject`)
    }
    if (block.planType !== 'stacjonarne' && block.planType !== 'niestacjonarne') {
      throw new TypeError(`state.blocks[${index}].planType: nieznany tryb`)
    }
  })
  requireArray(state.rooms, 'state.rooms').forEach((value, index) => {
    const room = requireRecord(value, `state.rooms[${index}]`)
    if (typeof room.code !== 'string') throw new TypeError(`state.rooms[${index}].code: oczekiwano tekstu`)
  })
  const validation = payload.validation === undefined
    ? { conflicts: [] }
    : requireRecord(payload.validation, 'validation')
  requireArray(validation.conflicts, 'validation.conflicts')
  if (payload.timetableNotices != null) parseTimetableNotices(payload.timetableNotices)
  return { ...payload, state: state as unknown as ScheduleState,
    validation: validation as unknown as SchedulePayload['validation'] } as SchedulePayload
}

export function parseScheduleState(input: unknown): ScheduleState {
  return parseSchedulePayload({ state: input }).state
}

/** An empty imported catalog is authoritative; callers should only fall back when absent. */
export function parseTimetableNotices(input: unknown): TimetableNotices {
  const catalog = requireRecord(input, 'timetableNotices')
  requireArray(catalog.notices, 'timetableNotices.notices')
  return catalog as unknown as TimetableNotices
}

export function importedNotices(payload: SchedulePayload): TimetableNotices | undefined {
  return payload.timetableNotices?.notices ? payload.timetableNotices : undefined
}
