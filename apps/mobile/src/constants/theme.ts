import '@/global.css';

import { Platform } from 'react-native';
import { getActivityMetadata, type ActivityColorTheme } from '@pk-planner/core';

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

export type ActivityStyle = ActivityColorTheme;

export function getActivityStyle(
  activity: string | undefined,
  scheme: 'light' | 'dark',
): ActivityStyle {
  return getActivityMetadata(activity)[scheme];
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
