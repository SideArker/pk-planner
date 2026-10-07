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
  todayDay: Day | null
  collisions: Map<string, BlockCollisionInfo[]>
  currentParityLabel: 'A' | 'B'
  parityFilter: string
  activeBlockIds?: Set<string>
  currentTime: Date
  onSelectBlock: (block: ScheduleBlock) => void
}

export function DayColumnsView({
  days,
  blocksByDay,
  todayDay,
  collisions,
  currentParityLabel,
  parityFilter,
  activeBlockIds,
  currentTime,
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
            className="flex min-h-[480px] flex-col gap-3 rounded-md border border-zinc-200 bg-zinc-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-900/40"
          >
            <div className="flex items-center justify-between border-b border-zinc-200/60 pb-2 dark:border-zinc-800">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {DAY_INFO[day][0]}
                </span>
                {isToday && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" title="Dziś" aria-label="Dziś" />
                )}
              </div>
              <span className="text-xs text-zinc-400" aria-label={`${dayBlocks.length} zajęć`}>{dayBlocks.length}</span>
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
                    isCurrent={activeBlockIds?.has(block.id)}
                    currentTime={currentTime}
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
