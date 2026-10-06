import AsyncStorage from '@react-native-async-storage/async-storage';
import { isRunningInExpoGo } from 'expo';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import type { ScheduleBlock } from '@pk-planner/core';
import { nextClassOccurrences } from './notificationSchedule';

export interface NotificationPreferences {
  reminders: boolean;
  countdown: boolean;
  scheduleUpdates: boolean;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  reminders: true,
  countdown: true,
  scheduleUpdates: true,
};

const PREFERENCES_KEY = 'pk_planner_notification_preferences';
const PREFERENCES_INITIALIZED_KEY = 'pk_planner_notification_preferences_initialized_v2';
const INSTALLATION_KEY = 'pk_planner_notification_installation';
const LOCAL_IDS_KEY = 'pk_planner_notification_ids';
const COUNTDOWN_STATE_KEY = 'pk_planner_countdown_enabled';
const API_URL = (process.env.EXPO_PUBLIC_API_URL ||
  'https://pk-planner.rsowa126.workers.dev/api/schedule').replace(/\/schedule\/?$/, '');

type NotificationsModule = typeof import('expo-notifications');
let notificationsPromise: Promise<NotificationsModule> | null = null;

function getNotifications(): Promise<NotificationsModule> {
  notificationsPromise ??= import('expo-notifications').then((Notifications) => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    return Notifications;
  });
  return notificationsPromise;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const Notifications = await getNotifications();
    await createChannels();
    const existing = await Notifications.getPermissionsAsync();
    if (existing.granted) return true;
    const requested = await Notifications.requestPermissionsAsync();
    return requested.granted;
  } catch {
    return false;
  }
}

export async function loadNotificationPreferences(): Promise<NotificationPreferences> {
  try {
    const initialized = await AsyncStorage.getItem(PREFERENCES_INITIALIZED_KEY);
    const value = await AsyncStorage.getItem(PREFERENCES_KEY);
    if (initialized === '1' && value) {
      const parsed = JSON.parse(value);
      return {
        reminders: typeof parsed.reminders === 'boolean' ? parsed.reminders : true,
        countdown: typeof parsed.countdown === 'boolean' ? parsed.countdown : true,
        scheduleUpdates: typeof parsed.scheduleUpdates === 'boolean' ? parsed.scheduleUpdates : true,
      };
    }
    // Domyślnie wszystkie powiadomienia są włączone
    await AsyncStorage.setItem(PREFERENCES_INITIALIZED_KEY, '1');
    await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(DEFAULT_NOTIFICATION_PREFERENCES));
    return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  } catch {
    return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  }
}

export async function saveNotificationPreferences(value: NotificationPreferences): Promise<void> {
  await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(value));
}

async function installationId(): Promise<string> {
  const stored = await AsyncStorage.getItem(INSTALLATION_KEY);
  if (stored) return stored;
  const id = Crypto.randomUUID();
  await AsyncStorage.setItem(INSTALLATION_KEY, id);
  return id;
}

async function clearLocalNotifications(): Promise<void> {
  const Notifications = await getNotifications();
  const saved = await AsyncStorage.getItem(LOCAL_IDS_KEY);
  let ids: string[] = [];
  try {
    const parsed = saved ? JSON.parse(saved) : [];
    if (Array.isArray(parsed)) ids = parsed.filter((item) => typeof item === 'string');
  } catch {
    // Discard a corrupted local ID list and rebuild the schedule.
  }
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})));
  await AsyncStorage.removeItem(LOCAL_IDS_KEY);
}

async function createChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;
  const Notifications = await getNotifications();
  await Notifications.setNotificationChannelAsync('classes', {
    name: 'Zajęcia',
    importance: Notifications.AndroidImportance.HIGH,
  });
  await Notifications.setNotificationChannelAsync('countdown', {
    name: 'Odliczanie zajęć',
    importance: Notifications.AndroidImportance.LOW,
  });
  await Notifications.setNotificationChannelAsync('updates', {
    name: 'Aktualizacje planu',
    importance: Notifications.AndroidImportance.HIGH,
  });
}

async function scheduleLocally(
  blocks: ScheduleBlock[],
  preferences: NotificationPreferences,
): Promise<void> {
  const Notifications = await getNotifications();
  const now = new Date();
  const requests: Array<{
    date: Date;
    title: string;
    body: string;
    sticky: boolean;
    channelId: string;
  }> = [];
  for (const occurrence of nextClassOccurrences(blocks, now)) {
    const { block, startsAt, endsAt } = occurrence;
    const title = block.subject || 'Zajęcia';
    if (preferences.reminders) {
      requests.push({
        date: new Date(startsAt.getTime() - 30 * 60_000),
        title: `Za 30 minut: ${title}`,
        body: `Początek o ${startsAt.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}`,
        sticky: false,
        channelId: 'classes',
      });
    }
    if (preferences.reminders || preferences.countdown) {
      requests.push({
        date: startsAt,
        title: preferences.countdown ? `Trwają zajęcia: ${title}` : `Zaczynają się: ${title}`,
        body: preferences.countdown
          ? `Do końca ${Math.ceil((endsAt.getTime() - startsAt.getTime()) / 60_000)} min`
          : 'Zajęcia właśnie się rozpoczynają.',
        sticky: false,
        channelId: preferences.countdown ? 'countdown' : 'classes',
      });
    }
  }
  requests.sort((a, b) => a.date.getTime() - b.date.getTime());
  const ids: string[] = [];
  for (const request of requests.filter((item) => item.date > now).slice(0, 60)) {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: request.title,
        body: request.body,
        sticky: request.sticky,
        data: { pkPlanner: true },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: request.date,
        channelId: request.channelId,
      },
    });
    ids.push(id);
  }
  await AsyncStorage.setItem(LOCAL_IDS_KEY, JSON.stringify(ids));
}

export async function syncNotifications(
  blocks: ScheduleBlock[],
  preferences: NotificationPreferences,
): Promise<'off' | 'fcm' | 'local' | 'permission-denied'> {
  if (Platform.OS === 'web') return 'off';
  const Notifications = await getNotifications();
  const id = await installationId();
  await clearLocalNotifications();
  const previousCountdown = await AsyncStorage.getItem(COUNTDOWN_STATE_KEY) === '1';
  if (previousCountdown && !preferences.countdown) {
    await Notifications.dismissAllNotificationsAsync().catch(() => {});
  }
  await AsyncStorage.setItem(COUNTDOWN_STATE_KEY, preferences.countdown ? '1' : '0');
  if (!preferences.reminders && !preferences.countdown && !preferences.scheduleUpdates) {
    await fetch(`${API_URL}/notifications/${id}`, { method: 'DELETE' }).catch(() => {});
    return 'off';
  }

  await createChannels();
  const existing = await Notifications.getPermissionsAsync();
  const permission = existing.granted ? existing : await Notifications.requestPermissionsAsync();
  if (!permission.granted) {
    await fetch(`${API_URL}/notifications/${id}`, { method: 'DELETE' }).catch(() => {});
    return 'permission-denied';
  }

  if (Platform.OS === 'android' && !isRunningInExpoGo()) {
    try {
      const token = await Notifications.getDevicePushTokenAsync();
      const response = await fetch(`${API_URL}/notifications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token.data,
          ...preferences,
          blocks: blocks
            .filter((block) => block.day && block.start != null)
            .slice(0, 120)
            .map((block) => ({
              id: block.id,
              subject: block.subject,
              day: block.day,
              date: block.date,
              start: block.start,
              duration: block.duration || 90,
              teachingWeekParity: block.teachingWeekParity,
              allowedWeekends: block.allowedWeekends,
              occurrenceWeekends: block.occurrenceWeekends,
            })),
        }),
      });
      if (response.ok) return 'fcm';
    } catch {
      // The development build may not contain Firebase credentials yet.
    }
  }
  await fetch(`${API_URL}/notifications/${id}`, { method: 'DELETE' }).catch(() => {});
  await scheduleLocally(blocks, preferences);
  return 'local';
}
