import { useMemo, useState } from 'react'
import {
  type Day,
  type PlanType,
  type ScheduleBlock,
  availableDays,
  DAY_INFO,
  DAY_INDEX_TO_DAY,
  detectScheduleCollisions,
  getTeachingWeekInfo,
  isBlockActiveNow,
  isBlockInWeekParity,
} from '@pk-planner/core'
import { useCurrentTime } from '../hooks/useCurrentTime'
import { BlockCard } from './BlockCard'
import { CollisionsBanner } from './schedule/CollisionsBanner'
import { DayColumnsView } from './schedule/DayColumnsView'
import { EmptyScheduleState } from './schedule/EmptyScheduleState'
import {
  computeDayBlockPositions,
  HourlyTimelineView,
  HOUR_HEIGHT,
  type PositionedBlock,
} from './schedule/HourlyTimelineView'
import {
  type ParityFilterType,
  ScheduleControls,
} from './schedule/ScheduleControls'

interface ScheduleViewProps {
  blocks: ScheduleBlock[]
  planType: PlanType
  onSelectBlock: (block: ScheduleBlock) => void
  onOpenCustomize: () => void
  onOpenAddCustom: () => void
}

export function ScheduleView({
  blocks,
  planType,
  onSelectBlock,
  onOpenCustomize,
  onOpenAddCustom,
}: ScheduleViewProps) {
  const now = useCurrentTime()
  const days: Day[] = useMemo(() => availableDays(planType), [planType])

  const actualToday: Day | null = useMemo(() => {
    return DAY_INDEX_TO_DAY[now.getDay()] ?? null
  }, [now])

  const todayDay: Day | null = useMemo(() => {
    if (!actualToday) return null
    return days.includes(actualToday) ? actualToday : null
  }, [actualToday, days])

  const [activeMobileDay, setActiveMobileDay] = useState<Day>(() => {
    const real = DAY_INDEX_TO_DAY[new Date().getDay()] || 'MON'
    const avail = availableDays(planType)
    return avail.includes(real) ? real : (avail[0] || 'MON')
  })
  const [desktopLayout, setDesktopLayout] = useState<'columns' | 'grid'>(() => {
    const saved = localStorage.getItem('pk_planner_desktop_layout')
    return saved === 'grid' ? 'grid' : 'columns'
  })

  const handleSetLayout = (newLayout: 'columns' | 'grid') => {
    setDesktopLayout(newLayout)
    localStorage.setItem('pk_planner_desktop_layout', newLayout)
  }

  const currentWeek = useMemo(() => getTeachingWeekInfo(now), [now])
  const [parityFilter, setParityFilter] = useState<ParityFilterType>('all')

  // Filter blocks by parity
  const filteredBlocks = useMemo(() => {
    return blocks.filter(b => {
      if (parityFilter === 'all') return true
      const targetParity = parityFilter === 'current' ? currentWeek.parityLabel : parityFilter
      return isBlockInWeekParity(b, targetParity)
    })
  }, [blocks, parityFilter, currentWeek])

  // Active blocks that are happening right now
  const activeBlockIds = useMemo(() => {
    const set = new Set<string>()
    for (const b of filteredBlocks) {
      if (isBlockActiveNow(b, now, currentWeek.parityLabel)) {
        set.add(b.id)
      }
    }
    return set
  }, [filteredBlocks, now, currentWeek.parityLabel])

  // Collisions detection
  const collisions = useMemo(() => {
    return detectScheduleCollisions(filteredBlocks)
  }, [filteredBlocks])

  // Group blocks by day
  const blocksByDay = useMemo(() => {
    const map: Record<Day, ScheduleBlock[]> = {
      MON: [],
      TUE: [],
      WED: [],
      THU: [],
      FRI: [],
      SAT: [],
      SUN: [],
    }

    for (const b of filteredBlocks) {
      if (b.day && map[b.day]) {
        map[b.day].push(b)
      }
    }

    // Sort each day chronologically
    for (const day of days) {
      map[day].sort((a, b) => (a.start ?? 0) - (b.start ?? 0))
    }

    return map
  }, [filteredBlocks, days])

  // Dynamic hours range
  const { startHour, hours } = useMemo(() => {
    const valid = filteredBlocks.filter(b => b.start != null)
    let minH = 7
    let maxH = 22

    if (valid.length > 0) {
      const starts = valid.map(b => b.start!)
      const ends = valid.map(b => b.start! + (b.duration || 90))
      minH = Math.min(7, Math.floor(Math.min(...starts) / 60))
      maxH = Math.max(22, Math.ceil(Math.max(...ends) / 60))
    }

    const list: number[] = []
    for (let h = minH; h < maxH; h++) {
      list.push(h)
    }
    return { startHour: minH, hours: list }
  }, [filteredBlocks])

  // Precompute positioned layout for each day in grid mode
  const positionedBlocksByDay = useMemo(() => {
    const map: Record<Day, PositionedBlock[]> = {
      MON: [],
      TUE: [],
      WED: [],
      THU: [],
      FRI: [],
      SAT: [],
      SUN: [],
    }
    for (const day of days) {
      map[day] = computeDayBlockPositions(blocksByDay[day], startHour, HOUR_HEIGHT)
    }
    return map
  }, [days, blocksByDay, startHour])

  return (
    <div className="space-y-4">
      {/* Subheader Toolbar */}
      <ScheduleControls
        planType={planType}
        currentWeek={currentWeek}
        blocksCount={filteredBlocks.length}
        parityFilter={parityFilter}
        onParityFilterChange={setParityFilter}
        desktopLayout={desktopLayout}
        onLayoutChange={handleSetLayout}
        onOpenCustomize={onOpenCustomize}
        onOpenAddCustom={onOpenAddCustom}
      />

      {/* Collision Warning Banner */}
      <CollisionsBanner collisions={collisions} />

      {/* Mobile Day Selector (tab pill buttons) */}
      <div className="lg:hidden">
        <div className="flex rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800 text-xs font-medium overflow-x-auto">
          {days.map(day => {
            const count = blocksByDay[day].length
            const isSelected = activeMobileDay === day
            const isToday = todayDay === day

            return (
              <button
                key={day}
                onClick={() => setActiveMobileDay(day)}
                className={`flex-1 min-w-[64px] py-2 px-1 text-center rounded-lg transition-all relative flex flex-col items-center gap-0.5 cursor-pointer ${
                  isSelected
                    ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-700 dark:text-zinc-100 font-semibold'
                    : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-1">
                  <span>{DAY_INFO[day][0]}</span>
                  {isToday && (
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500 dark:bg-blue-400" />
                  )}
                </div>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    count > 0
                      ? 'bg-zinc-200/60 dark:bg-zinc-600 text-zinc-700 dark:text-zinc-200 font-semibold'
                      : 'text-zinc-300 dark:text-zinc-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Mobile Day Content List */}
      <div className="lg:hidden">
        {blocksByDay[activeMobileDay].length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 py-16 px-4 text-center">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Brak zajęć w tym dniu
            </p>
            <p className="text-xs text-zinc-400 mt-1">Dzień wolny lub brak planu.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {blocksByDay[activeMobileDay].map(block => (
              <BlockCard
                key={block.id}
                block={block}
                collisionInfo={collisions.get(block.id)}
                currentParity={currentWeek.parityLabel}
                dimWhenNotCurrentWeek={parityFilter === 'all'}
                isCurrent={activeBlockIds.has(block.id)}
                currentTime={now}
                onClick={onSelectBlock}
              />
            ))}
          </div>
        )}
      </div>

      {/* Desktop Weekly View */}
      {filteredBlocks.length === 0 ? (
        <EmptyScheduleState onOpenAddCustom={onOpenAddCustom} />
      ) : desktopLayout === 'grid' ? (
        <HourlyTimelineView
          days={days}
          blocksByDay={blocksByDay}
          positionedBlocksByDay={positionedBlocksByDay}
          todayDay={todayDay}
          hours={hours}
          collisions={collisions}
          currentParityLabel={currentWeek.parityLabel}
          parityFilter={parityFilter}
          activeBlockIds={activeBlockIds}
          currentTime={now}
          onSelectBlock={onSelectBlock}
        />
      ) : (
        <DayColumnsView
          days={days}
          blocksByDay={blocksByDay}
          todayDay={todayDay}
          collisions={collisions}
          currentParityLabel={currentWeek.parityLabel}
          parityFilter={parityFilter}
          activeBlockIds={activeBlockIds}
          currentTime={now}
          onSelectBlock={onSelectBlock}
        />
      )}
    </div>
  )
}
