import {
  type BlockCollisionInfo,
  type Day,
  type ScheduleBlock,
  DAY_INFO,
} from '@pk-planner/core'
import { BlockCard } from '../BlockCard'

interface DayColumnsViewProps {
  days: Day[]
  blocksByDay: Record<Day, ScheduleBlock[]>
  todayDay: Day
  collisions: Map<string, BlockCollisionInfo[]>
  currentParityLabel: 'A' | 'B'
  parityFilter: string
  onSelectBlock: (block: ScheduleBlock) => void
}

export function DayColumnsView({
  days,
  blocksByDay,
  todayDay,
  collisions,
  currentParityLabel,
  parityFilter,
  onSelectBlock,
}: DayColumnsViewProps) {
  return (
    <div
      className="hidden lg:grid gap-3.5 items-start"
      style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
    >
      {days.map(day => {
        const dayBlocks = blocksByDay[day]
        const isToday = todayDay === day

        return (
          <div
            key={day}
            className={`rounded-2xl border transition-all ${
              isToday
                ? 'border-blue-300 dark:border-blue-900/80 bg-blue-50/20 dark:bg-blue-950/10'
                : 'border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/40 dark:bg-zinc-900/40'
            } p-3 flex flex-col gap-3 min-h-[480px]`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-zinc-200/60 dark:border-zinc-800">
              <div className="flex items-center gap-1.5">
                <span
                  className={`font-semibold text-sm ${
                    isToday
                      ? 'text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-zinc-900 dark:text-zinc-100'
                  }`}
                >
                  {DAY_INFO[day][0]}
                </span>
                {isToday && (
                  <span className="text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-1.5 py-0.2 rounded font-medium">
                    Dziś
                  </span>
                )}
              </div>
              <span className="text-xs text-zinc-400">{dayBlocks.length}</span>
            </div>

            {dayBlocks.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12 text-zinc-300 dark:text-zinc-700">
                <span className="text-xs">Brak zajęć</span>
              </div>
            ) : (
              <div className="space-y-2.5">
                {dayBlocks.map(block => (
                  <BlockCard
                    key={block.id}
                    block={block}
                    collisionInfo={collisions.get(block.id)}
                    currentParity={currentParityLabel}
                    dimWhenNotCurrentWeek={parityFilter === 'all'}
                    onClick={onSelectBlock}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
