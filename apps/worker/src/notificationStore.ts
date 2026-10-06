import { sendFcm } from './fcm.ts';
import {
  notificationEvents,
  type RegisteredBlock,
  type Registration,
} from './notificationEvents.ts';

const DAYS = new Set(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']);

export function parseRegistration(input: unknown): Registration | null {
  if (!input || typeof input !== 'object') return null;
  const value = input as Record<string, unknown>;
  if (typeof value.token !== 'string' || value.token.length < 20 || value.token.length > 4096 ||
    !Array.isArray(value.blocks) || value.blocks.length > 120 ||
    typeof value.reminders !== 'boolean' || typeof value.countdown !== 'boolean') return null;

  const blocks: RegisteredBlock[] = [];
  for (const raw of value.blocks) {
    if (!raw || typeof raw !== 'object') return null;
    const block = raw as Record<string, unknown>;
    if (typeof block.id !== 'string' || block.id.length > 160 ||
      typeof block.subject !== 'string' || block.subject.length > 160 ||
      !DAYS.has(String(block.day)) ||
      !Number.isInteger(block.start) || Number(block.start) < 0 || Number(block.start) >= 1440 ||
      !Number.isInteger(block.duration) || Number(block.duration) < 1 || Number(block.duration) > 600 ||
      (block.date != null && (typeof block.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(block.date))) ||
      (block.teachingWeekParity != null && block.teachingWeekParity !== 0 && block.teachingWeekParity !== 1)) {
      return null;
    }
    const weekends = [block.allowedWeekends, block.occurrenceWeekends];
    if (weekends.some((item) => item != null && (!Array.isArray(item) || item.length > 80 ||
      !item.every((entry) => typeof entry === 'string' && /^\d{4}-\d{2}-\d{2}_\d{4}-\d{2}-\d{2}$/.test(entry))))) {
      return null;
    }
    blocks.push({
      id: block.id,
      subject: block.subject,
      day: block.day as RegisteredBlock['day'],
      date: block.date as string | null | undefined,
      start: Number(block.start),
      duration: Number(block.duration),
      teachingWeekParity: block.teachingWeekParity as number | null | undefined,
      allowedWeekends: block.allowedWeekends as string[] | undefined,
      occurrenceWeekends: block.occurrenceWeekends as string[] | undefined,
    });
  }
  return {
    token: value.token,
    reminders: value.reminders,
    countdown: value.countdown,
    blocks,
    registeredAt: Date.now(),
  };
}

interface StoreEnv {
  FCM_SERVICE_ACCOUNT_JSON?: string;
}

export class NotificationStore {
  private readonly state: DurableObjectState;
  private readonly env: StoreEnv;

  constructor(state: DurableObjectState, env: StoreEnv) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/tick') {
      if (!this.env.FCM_SERVICE_ACCOUNT_JSON) return new Response('FCM not configured', { status: 503 });
      const now = new Date(Number(url.searchParams.get('at')) || Date.now());
      const minute = String(Math.floor(now.getTime() / 60_000));
      const registrations = await this.state.storage.list<Registration>({ prefix: 'device:' });
      let sent = 0;
      for (const [key, registration] of registrations) {
        if (registration.registeredAt < Date.now() - 180 * 86_400_000) {
          await this.state.storage.delete(key);
          continue;
        }
        if (registration.lastMinute === minute) continue;
        try {
          for (const event of notificationEvents(registration, now)) {
            await sendFcm(this.env.FCM_SERVICE_ACCOUNT_JSON, registration.token, event);
            sent += 1;
          }
          registration.lastMinute = minute;
          await this.state.storage.put(key, registration);
        } catch (error) {
          console.error('FCM delivery failed', error instanceof Error ? error.message : error);
        }
      }
      return Response.json({ sent });
    }

    const key = `device:${url.pathname.slice(1)}`;
    if (request.method === 'DELETE') {
      await this.state.storage.delete(key);
      return Response.json({ ok: true });
    }
    if (request.method === 'PUT') {
      const registration = await request.json() as Registration;
      await this.state.storage.put(key, registration);
      return Response.json({ ok: true });
    }
    return new Response('Not found', { status: 404 });
  }
}
