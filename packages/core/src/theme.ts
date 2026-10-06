import type { Day } from './types'

export interface ActivityColorTheme {
  badgeBg: string
  badgeText: string
  border: string
  cardBg: string
}

export interface ActivityMetadata {
  key: string
  label: string
  hex: string
  light: ActivityColorTheme
  dark: ActivityColorTheme
}

export const ACTIVITY_METADATA: Record<string, ActivityMetadata> = {
  w: {
    key: 'w',
    label: 'Wykład',
    hex: '#3b82f6',
    light: {
      badgeBg: '#dbeafe',
      badgeText: '#1d4ed8',
      border: '#3b82f6',
      cardBg: '#ffffff',
    },
    dark: {
      badgeBg: '#1e3a8a',
      badgeText: '#93c5fd',
      border: '#3b82f6',
      cardBg: '#18181b',
    },
  },
  c: {
    key: 'c',
    label: 'Ćwiczenia',
    hex: '#10b981',
    light: {
      badgeBg: '#d1fae5',
      badgeText: '#047857',
      border: '#10b981',
      cardBg: '#ffffff',
    },
    dark: {
      badgeBg: '#064e3b',
      badgeText: '#6ee7b7',
      border: '#10b981',
      cardBg: '#18181b',
    },
  },
  cw: {
    key: 'cw',
    label: 'Ćwiczenia',
    hex: '#10b981',
    light: {
      badgeBg: '#d1fae5',
      badgeText: '#047857',
      border: '#10b981',
      cardBg: '#ffffff',
    },
    dark: {
      badgeBg: '#064e3b',
      badgeText: '#6ee7b7',
      border: '#10b981',
      cardBg: '#18181b',
    },
  },
  l: {
    key: 'l',
    label: 'Laboratorium',
    hex: '#f59e0b',
    light: {
      badgeBg: '#fef3c7',
      badgeText: '#b45309',
      border: '#f59e0b',
      cardBg: '#ffffff',
    },
    dark: {
      badgeBg: '#78350f',
      badgeText: '#fde68a',
      border: '#f59e0b',
      cardBg: '#18181b',
    },
  },
  lab: {
    key: 'lab',
    label: 'Laboratorium',
    hex: '#f59e0b',
    light: {
      badgeBg: '#fef3c7',
      badgeText: '#b45309',
      border: '#f59e0b',
      cardBg: '#ffffff',
    },
    dark: {
      badgeBg: '#78350f',
      badgeText: '#fde68a',
      border: '#f59e0b',
      cardBg: '#18181b',
    },
  },
  p: {
    key: 'p',
    label: 'Projekt',
    hex: '#a855f7',
    light: {
      badgeBg: '#f3e8ff',
      badgeText: '#7e22ce',
      border: '#a855f7',
      cardBg: '#ffffff',
    },
    dark: {
      badgeBg: '#581c87',
      badgeText: '#d8b4fe',
      border: '#a855f7',
      cardBg: '#18181b',
    },
  },
  proj: {
    key: 'proj',
    label: 'Projekt',
    hex: '#a855f7',
    light: {
      badgeBg: '#f3e8ff',
      badgeText: '#7e22ce',
      border: '#a855f7',
      cardBg: '#ffffff',
    },
    dark: {
      badgeBg: '#581c87',
      badgeText: '#d8b4fe',
      border: '#a855f7',
      cardBg: '#18181b',
    },
  },
  s: {
    key: 's',
    label: 'Seminarium',
    hex: '#f43f5e',
    light: {
      badgeBg: '#ffe4e6',
      badgeText: '#be123c',
      border: '#f43f5e',
      cardBg: '#ffffff',
    },
    dark: {
      badgeBg: '#881337',
      badgeText: '#fda4af',
      border: '#f43f5e',
      cardBg: '#18181b',
    },
  },
  sem: {
    key: 'sem',
    label: 'Seminarium',
    hex: '#f43f5e',
    light: {
      badgeBg: '#ffe4e6',
      badgeText: '#be123c',
      border: '#f43f5e',
      cardBg: '#ffffff',
    },
    dark: {
      badgeBg: '#881337',
      badgeText: '#fda4af',
      border: '#f43f5e',
      cardBg: '#18181b',
    },
  },
  lektorat: {
    key: 'lektorat',
    label: 'Lektorat',
    hex: '#06b6d4',
    light: {
      badgeBg: '#cffafe',
      badgeText: '#0e7490',
      border: '#06b6d4',
      cardBg: '#ffffff',
    },
    dark: {
      badgeBg: '#164e63',
      badgeText: '#67e8f9',
      border: '#06b6d4',
      cardBg: '#18181b',
    },
  },
  lek: {
    key: 'lek',
    label: 'Lektorat',
    hex: '#06b6d4',
    light: {
      badgeBg: '#cffafe',
      badgeText: '#0e7490',
      border: '#06b6d4',
      cardBg: '#ffffff',
    },
    dark: {
      badgeBg: '#164e63',
      badgeText: '#67e8f9',
      border: '#06b6d4',
      cardBg: '#18181b',
    },
  },
  wf: {
    key: 'wf',
    label: 'WF',
    hex: '#f97316',
    light: {
      badgeBg: '#ffedd5',
      badgeText: '#c2410c',
      border: '#f97316',
      cardBg: '#ffffff',
    },
    dark: {
      badgeBg: '#7c2d12',
      badgeText: '#fdba74',
      border: '#f97316',
      cardBg: '#18181b',
    },
  },
}

export const DEFAULT_ACTIVITY_METADATA: ActivityMetadata = {
  key: 'default',
  label: 'Zajęcia',
  hex: '#71717a',
  light: {
    badgeBg: '#f1f5f9',
    badgeText: '#334155',
    border: '#64748b',
    cardBg: '#ffffff',
  },
  dark: {
    badgeBg: '#27272a',
    badgeText: '#d4d4d8',
    border: '#71717a',
    cardBg: '#18181b',
  },
}

export function getActivityMetadata(activity?: string): ActivityMetadata {
  const key = (activity || '').toLowerCase().trim()
  return ACTIVITY_METADATA[key] || DEFAULT_ACTIVITY_METADATA
}

export interface ScheduleSlot {
  index: number
  start: number
  duration: number
  label: string
}

export const STANDARD_PK_SLOTS: ScheduleSlot[] = [
  { index: 1, start: 450, duration: 90, label: '07:30 - 09:00 (Blok 1)' },
  { index: 2, start: 555, duration: 90, label: '09:15 - 10:45 (Blok 2)' },
  { index: 3, start: 660, duration: 90, label: '11:00 - 12:30 (Blok 3)' },
  { index: 4, start: 765, duration: 90, label: '12:45 - 14:15 (Blok 4)' },
  { index: 5, start: 870, duration: 90, label: '14:30 - 16:00 (Blok 5)' },
  { index: 6, start: 975, duration: 90, label: '16:15 - 17:45 (Blok 6)' },
  { index: 7, start: 1080, duration: 90, label: '18:00 - 19:30 (Blok 7)' },
  { index: 8, start: 1185, duration: 90, label: '19:45 - 21:15 (Blok 8)' },
]

export const DAY_SHORT_LABELS: Record<Day, string> = {
  MON: 'Pn',
  TUE: 'Wt',
  WED: 'Śr',
  THU: 'Czw',
  FRI: 'Pt',
  SAT: 'Sb',
  SUN: 'Nd',
}
