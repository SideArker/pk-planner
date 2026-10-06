import {
  getTeachingWeekInfo,
  isBlockInWeekParity,
  type Day,
  type ScheduleBlock,
} from '@pk-planner/core';

const DAYS: Day[] = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export interface ClassOccurrence {
  block: ScheduleBlock;
  startsAt: Date;
  endsAt: Date;
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function nextClassOccurrences(
  blocks: ScheduleBlock[],
  now = new Date(),
  daysAhead = 14,
): ClassOccurrence[] {
  const result: ClassOccurrence[] = [];
  for (let offset = 0; offset < daysAhead; offset += 1) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    const key = dateKey(day);
    const weekendSaturday = new Date(day);
    weekendSaturday.setDate(day.getDate() - ((day.getDay() + 1) % 7));
    const weekendSunday = new Date(weekendSaturday);
    weekendSunday.setDate(weekendSaturday.getDate() + 1);
    const weekendKey = `${dateKey(weekendSaturday)}_${dateKey(weekendSunday)}`;
    const parity = getTeachingWeekInfo(day).parityLabel;

    for (const block of blocks) {
      if (block.day !== DAYS[day.getDay()] || block.start == null) continue;
      if (!isBlockInWeekParity(block, parity)) continue;
      if (block.date && block.date !== key) continue;
      const weekends = block.occurrenceWeekends?.length
        ? block.occurrenceWeekends
        : block.allowedWeekends;
      if (weekends?.length && !weekends.includes(weekendKey)) continue;
      const startsAt = new Date(day);
      startsAt.setMinutes(block.start);
      const endsAt = new Date(startsAt.getTime() + Math.max(1, block.duration || 90) * 60_000);
      if (endsAt <= now) continue;
      result.push({ block, startsAt, endsAt });
    }
  }
  return result.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}
