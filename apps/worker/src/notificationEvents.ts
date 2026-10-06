export interface RegisteredBlock {
  id: string;
  subject: string;
  day: 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';
  date?: string | null;
  start: number;
  duration: number;
  teachingWeekParity?: number | null;
  allowedWeekends?: string[];
  occurrenceWeekends?: string[];
}

export interface Registration {
  token: string;
  reminders: boolean;
  countdown: boolean;
  blocks: RegisteredBlock[];
  registeredAt: number;
  lastMinute?: string;
}

export interface NotificationEvent {
  title: string;
  body: string;
  tag: string;
  channelId: 'classes' | 'countdown';
  sticky: boolean;
}

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const anchorMonday = Date.UTC(2026, 8, 28);
const warsawFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Warsaw',
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

function localParts(instant: Date) {
  const parts = Object.fromEntries(warsawFormatter.formatToParts(instant)
    .filter((part) => part.type !== 'literal')
    .map((part) => [part.type, Number(part.value)]));
  const dayUtc = Date.UTC(parts.year, parts.month - 1, parts.day);
  const weekday = new Date(dayUtc).getUTCDay();
  const mondayUtc = dayUtc - ((weekday + 6) % 7) * 86_400_000;
  const week = Math.max(1, Math.floor((mondayUtc - anchorMonday) / 604_800_000) + 1);
  const key = `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
  const saturdayUtc = dayUtc - ((weekday + 1) % 7) * 86_400_000;
  const saturday = new Date(saturdayUtc).toISOString().slice(0, 10);
  const sunday = new Date(saturdayUtc + 86_400_000).toISOString().slice(0, 10);
  return {
    day: WEEKDAYS[weekday],
    date: key,
    weekend: `${saturday}_${sunday}`,
    minute: parts.hour * 60 + parts.minute,
    parity: week % 2 === 1 ? 0 : 1,
  };
}

function matches(block: RegisteredBlock, time: ReturnType<typeof localParts>): boolean {
  if (block.day !== time.day) return false;
  if (block.date && block.date !== time.date) return false;
  if (block.teachingWeekParity != null && block.teachingWeekParity !== time.parity) return false;
  const weekends = block.occurrenceWeekends?.length
    ? block.occurrenceWeekends
    : block.allowedWeekends;
  return !weekends?.length || weekends.includes(time.weekend);
}

export function notificationEvents(registration: Registration, now: Date): NotificationEvent[] {
  const current = localParts(now);
  const inThirtyMinutes = localParts(new Date(now.getTime() + 30 * 60_000));
  const events: NotificationEvent[] = [];
  for (const block of registration.blocks) {
    const tag = `class-${block.id}-${current.date}`.slice(0, 60);
    const title = block.subject || 'Zajęcia';
    if (registration.reminders && matches(block, inThirtyMinutes) &&
      block.start === inThirtyMinutes.minute) {
      events.push({
        title: `Za 30 minut: ${title}`,
        body: `Początek o ${String(Math.floor(block.start / 60)).padStart(2, '0')}:${String(block.start % 60).padStart(2, '0')}`,
        tag: `before-${block.id}-${inThirtyMinutes.date}`.slice(0, 60),
        channelId: 'classes',
        sticky: false,
      });
    }
    if (!matches(block, current)) continue;
    const remaining = block.start + block.duration - current.minute;
    if (registration.countdown && remaining > 0 && current.minute >= block.start &&
      (current.minute - block.start) % 5 === 0) {
      events.push({
        title: `Trwają zajęcia: ${title}`,
        body: `Do końca ${remaining} min`,
        tag,
        channelId: 'countdown',
        sticky: true,
      });
    } else if (registration.reminders && !registration.countdown && current.minute === block.start) {
      events.push({
        title: `Zaczynają się: ${title}`,
        body: 'Zajęcia właśnie się rozpoczynają.',
        tag,
        channelId: 'classes',
        sticky: false,
      });
    }
    if (registration.countdown && current.minute === block.start + block.duration) {
      events.push({
        title: `Koniec zajęć: ${title}`,
        body: 'Zajęcia się zakończyły.',
        tag,
        channelId: 'countdown',
        sticky: false,
      });
    }
  }
  return events;
}
