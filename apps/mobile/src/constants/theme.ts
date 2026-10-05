import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0f172a',
    background: '#f8fafc',
    backgroundElement: '#f1f5f9',
    backgroundSelected: '#e2e8f0',
    textSecondary: '#64748b',
    card: '#ffffff',
    border: '#e2e8f0',
    cardBorder: '#e2e8f0',
    primary: '#18181b',
    primaryText: '#ffffff',
    accent: '#3b82f6',
    destructive: '#ef4444',
    destructiveBg: '#fee2e2',
    warning: '#f59e0b',
    warningBg: '#fef3c7',
    success: '#10b981',
    inputBg: '#ffffff',
  },
  dark: {
    text: '#f4f4f5',
    background: '#09090b',
    backgroundElement: '#18181b',
    backgroundSelected: '#27272a',
    textSecondary: '#a1a1aa',
    card: '#18181b',
    border: '#27272a',
    cardBorder: '#27272a',
    primary: '#fafafa',
    primaryText: '#09090b',
    accent: '#60a5fa',
    destructive: '#f87171',
    destructiveBg: '#450a0a',
    warning: '#fbbf24',
    warningBg: '#451a03',
    success: '#34d399',
    inputBg: '#18181b',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export interface ActivityStyle {
  badgeBg: string;
  badgeText: string;
  border: string;
  cardBg: string;
}

export const ActivityStyles = {
  light: {
    w: {
      badgeBg: '#dbeafe',
      badgeText: '#1d4ed8',
      border: '#3b82f6',
      cardBg: '#ffffff',
    },
    c: {
      badgeBg: '#d1fae5',
      badgeText: '#047857',
      border: '#10b981',
      cardBg: '#ffffff',
    },
    cw: {
      badgeBg: '#d1fae5',
      badgeText: '#047857',
      border: '#10b981',
      cardBg: '#ffffff',
    },
    l: {
      badgeBg: '#fef3c7',
      badgeText: '#b45309',
      border: '#f59e0b',
      cardBg: '#ffffff',
    },
    lab: {
      badgeBg: '#fef3c7',
      badgeText: '#b45309',
      border: '#f59e0b',
      cardBg: '#ffffff',
    },
    p: {
      badgeBg: '#f3e8ff',
      badgeText: '#7e22ce',
      border: '#a855f7',
      cardBg: '#ffffff',
    },
    proj: {
      badgeBg: '#f3e8ff',
      badgeText: '#7e22ce',
      border: '#a855f7',
      cardBg: '#ffffff',
    },
    s: {
      badgeBg: '#ffe4e6',
      badgeText: '#be123c',
      border: '#f43f5e',
      cardBg: '#ffffff',
    },
    sem: {
      badgeBg: '#ffe4e6',
      badgeText: '#be123c',
      border: '#f43f5e',
      cardBg: '#ffffff',
    },
    lektorat: {
      badgeBg: '#cffafe',
      badgeText: '#0e7490',
      border: '#06b6d4',
      cardBg: '#ffffff',
    },
    lek: {
      badgeBg: '#cffafe',
      badgeText: '#0e7490',
      border: '#06b6d4',
      cardBg: '#ffffff',
    },
    wf: {
      badgeBg: '#ffedd5',
      badgeText: '#c2410c',
      border: '#f97316',
      cardBg: '#ffffff',
    },
    default: {
      badgeBg: '#f1f5f9',
      badgeText: '#334155',
      border: '#64748b',
      cardBg: '#ffffff',
    },
  },
  dark: {
    w: {
      badgeBg: '#1e3a8a',
      badgeText: '#93c5fd',
      border: '#3b82f6',
      cardBg: '#18181b',
    },
    c: {
      badgeBg: '#064e3b',
      badgeText: '#6ee7b7',
      border: '#10b981',
      cardBg: '#18181b',
    },
    cw: {
      badgeBg: '#064e3b',
      badgeText: '#6ee7b7',
      border: '#10b981',
      cardBg: '#18181b',
    },
    l: {
      badgeBg: '#78350f',
      badgeText: '#fde68a',
      border: '#f59e0b',
      cardBg: '#18181b',
    },
    lab: {
      badgeBg: '#78350f',
      badgeText: '#fde68a',
      border: '#f59e0b',
      cardBg: '#18181b',
    },
    p: {
      badgeBg: '#581c87',
      badgeText: '#d8b4fe',
      border: '#a855f7',
      cardBg: '#18181b',
    },
    proj: {
      badgeBg: '#581c87',
      badgeText: '#d8b4fe',
      border: '#a855f7',
      cardBg: '#18181b',
    },
    s: {
      badgeBg: '#881337',
      badgeText: '#fda4af',
      border: '#f43f5e',
      cardBg: '#18181b',
    },
    sem: {
      badgeBg: '#881337',
      badgeText: '#fda4af',
      border: '#f43f5e',
      cardBg: '#18181b',
    },
    lektorat: {
      badgeBg: '#164e63',
      badgeText: '#67e8f9',
      border: '#06b6d4',
      cardBg: '#18181b',
    },
    lek: {
      badgeBg: '#164e63',
      badgeText: '#67e8f9',
      border: '#06b6d4',
      cardBg: '#18181b',
    },
    wf: {
      badgeBg: '#7c2d12',
      badgeText: '#fdba74',
      border: '#f97316',
      cardBg: '#18181b',
    },
    default: {
      badgeBg: '#27272a',
      badgeText: '#d4d4d8',
      border: '#71717a',
      cardBg: '#18181b',
    },
  },
} as const;

export function getActivityStyle(
  activity: string | undefined,
  scheme: 'light' | 'dark',
): ActivityStyle {
  const key = (activity || '').toLowerCase().trim();
  const styles = ActivityStyles[scheme];
  return (styles as Record<string, ActivityStyle>)[key] || styles.default;
}

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 64, android: 72 }) ?? 64;
export const MaxContentWidth = 800;
