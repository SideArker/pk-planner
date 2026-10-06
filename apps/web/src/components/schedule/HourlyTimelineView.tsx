import {
  type BlockCollisionInfo,
  type Day,
  type ScheduleBlock,
  DAY_INFO,
} from '@pk-planner/core'
import { BlockCard } from '../BlockCard'

export const HOUR_HEIGHT = 80

export interface PositionedBlock {
  block: ScheduleBlock
  top: number
  height: number
  leftPercent: number
  widthPercent: number
  isNarrow: boolean
  isShort: boolean
}

export function computeDayBlockPositions(
  dayBlocks: ScheduleBlock[],
  startHour: number,
  hourHeight: number,
): PositionedBlock[] {
  const valid = dayBlocks.filter(b => b.start != null)
  if (valid.length === 0) return []

  const pxPerMinute = hourHeight / 60
  const startMinute = startHour * 60

  const sorted = [...valid].sort((a, b) => {
    if (a.start! !== b.start!) return a.start! - b.start!
    return (b.duration || 90) - (a.duration || 90)
  })

  const clusters: ScheduleBlock[][] = []
  let currentCluster: ScheduleBlock[] = []
  let clusterEnd = -1

  for (const block of sorted) {
    const bStart = block.start!
    const bEnd = bStart + (block.duration || 90)

    if (currentCluster.length === 0 || bStart < clusterEnd) {
      currentCluster.push(block)
      clusterEnd = Math.max(clusterEnd, bEnd)
    } else {
      clusters.push(currentCluster)
      currentCluster = [block]
      clusterEnd = bEnd
    }
  }
  if (currentCluster.length > 0) {
    clusters.push(currentCluster)
  }

  const result: PositionedBlock[] = []

  for (const cluster of clusters) {
    const colEnds: number[] = []
    const blockCol = new Map<string, number>()

    for (const block of cluster) {
      const bStart = block.start!
      const bEnd = bStart + (block.duration || 90)

      let col = -1
      for (let c = 0; c < colEnds.length; c++) {
        if (colEnds[c] <= bStart) {
          col = c
          colEnds[c] = bEnd
          break
        }
      }
      if (col === -1) {
        col = colEnds.length
        colEnds.push(bEnd)
      }
      blockCol.set(block.id, col)
    }

    const numCols = colEnds.length

    for (const block of cluster) {
      const bStart = block.start!
      const dur = block.duration || 90
      const col = blockCol.get(block.id)!

      const top = (bStart - startMinute) * pxPerMinute
      const height = Math.max(38, dur * pxPerMinute - 3)
      const widthPercent = 100 / numCols
      const leftPercent = col * widthPercent

      result.push({
        block,
        top,
        height,
        leftPercent,
        widthPercent,
        isNarrow: numCols > 1,
        isShort: height < 85,
      })
    }
  }

  return result
}

interface HourlyTimelineViewProps {
  days: Day[]
  blocksByDay: Record<Day, ScheduleBlock[]>
  positionedBlocksByDay: Record<Day, PositionedBlock[]>
  todayDay: Day
  hours: number[]
  collisions: Map<string, BlockCollisionInfo[]>
  currentParityLabel: 'A' | 'B'
  parityFilter: string
  onSelectBlock: (block: ScheduleBlock) => void
}

export function HourlyTimelineView({
  days,
  blocksByDay,
  positionedBlocksByDay,
  todayDay,
  hours,
  collisions,
  currentParityLabel,
  parityFilter,
  onSelectBlock,
}: HourlyTimelineViewProps) {
  return (
    <div className="hidden lg:flex flex-col gap-2.5">
      {/* Header Row */}
      <div className="flex items-center gap-2.5 sticky top-2 z-20">
        <div className="w-20 shrink-0 p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm flex items-center justify-center text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider shadow-xs">
          Godzina
        </div>

        {days.map(day => {
          const count = blocksByDay[day].length
          const isToday = todayDay === day

          return (
            <div
              key={day}
              className={`flex-1 min-w-0 p-3 rounded-xl border font-medium flex items-center justify-between shadow-xs transition-colors backdrop-blur-sm ${
                isToday
                  ? 'border-blue-400/90 dark:border-blue-800 bg-blue-50/90 dark:bg-blue-950/80 text-blue-900 dark:text-blue-100'
                  : 'border-zinc-200/80 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 text-zinc-900 dark:text-zinc-100'
              }`}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-bold text-sm tracking-tight truncate">
                  {DAY_INFO[day][0]}
                </span>
                {isToday && (
                  <span className="text-[10px] bg-blue-600 text-white dark:bg-blue-500 px-1.5 py-0.5 rounded-full font-semibold shadow-xs">
                    Dziś
                  </span>
                )}
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                  count > 0
                    ? isToday
                      ? 'bg-blue-200/60 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                    : 'text-zinc-300 dark:text-zinc-600'
                }`}
              >
                {count}
              </span>
            </div>
          )
        })}
      </div>

      {/* Grid Canvas */}
      <div className="flex gap-2.5 items-stretch relative">
        {/* Left Hours Axis */}
        <div className="w-20 shrink-0 flex flex-col rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xs py-1 shadow-xs">
          {hours.map(h => (
            <div
              key={h}
              style={{ height: HOUR_HEIGHT }}
              className="relative flex items-start justify-center pt-1"
            >
              <span className="text-xs font-mono font-medium text-zinc-500 dark:text-zinc-400 tracking-tight">
                {String(h).padStart(2, '0')}:00
              </span>
              <div className="absolute top-1/2 right-0 left-3 border-t border-dotted border-zinc-200/80 dark:border-zinc-800/80" />
            </div>
          ))}
        </div>

        {/* Day Columns */}
        {days.map(day => {
          const positioned = positionedBlocksByDay[day]
          const isToday = todayDay === day

          return (
            <div
              key={day}
              className={`flex-1 min-w-0 relative rounded-2xl border transition-colors shadow-xs ${
                isToday
                  ? 'border-blue-300/80 dark:border-blue-900/60 bg-blue-50/15 dark:bg-blue-950/10'
                  : 'border-zinc-200/80 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/40'
              }`}
            >
              {/* Hourly dashed lines */}
              {hours.map(h => (
                <div
                  key={h}
                  style={{ height: HOUR_HEIGHT }}
                  className="relative border-b border-dashed border-zinc-200/90 dark:border-zinc-800/90"
                >
                  <div className="absolute inset-x-0 top-1/2 border-b border-dotted border-zinc-100 dark:border-zinc-800/40 pointer-events-none" />
                </div>
              ))}

              {/* Absolute Positioned Blocks */}
              <div className="absolute inset-0 pointer-events-none">
                {positioned.map(pos => (
                  <div
                    key={pos.block.id}
                    className="absolute pointer-events-auto transition-all"
                    style={{
                      top: pos.top + 2,
                      height: pos.height,
                      left: `calc(${pos.leftPercent}% + 1.5px)`,
                      width: `calc(${pos.widthPercent}% - 3px)`,
                      zIndex: 10,
                    }}
                  >
                    <BlockCard
                      block={pos.block}
                      collisionInfo={collisions.get(pos.block.id)}
                      currentParity={currentParityLabel}
                      dimWhenNotCurrentWeek={parityFilter === 'all'}
                      isCompact={pos.isNarrow || pos.isShort}
                      className="h-full flex flex-col justify-between overflow-hidden shadow-xs hover:z-30 hover:shadow-md"
                      onClick={onSelectBlock}
                    />
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
