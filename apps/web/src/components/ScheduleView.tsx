import { useMemo, useState } from 'react'
import {
  type Day,
  type PlanType,
  type ScheduleBlock,
  availableDays,
  DAY_INFO,
} from '@pk-planner/core'
import { Calendar, Filter, Sparkles } from 'lucide-react'
import { BlockCard } from './BlockCard'

interface ScheduleViewProps {
  blocks: ScheduleBlock[]
  planType: PlanType
  onSelectBlock: (block: ScheduleBlock) => void
  onOpenCustomize: () => void
}

function getInitialToday(days: Day[]): Day {
  const dayIndex = new Date().getDay()
  const map: Record<number, Day> = {
    1: 'MON',
    2: 'TUE',
    3: 'WED',
    4: 'THU',
    5: 'FRI',
    6: 'SAT',
    0: 'SUN',
  }
  const current = map[dayIndex] || 'MON'
  return days.includes(current) ? current : (days[0] || 'MON')
}

export function ScheduleView({
  blocks,
  planType,
  onSelectBlock,
  onOpenCustomize,
}: ScheduleViewProps) {
  const days: Day[] = useMemo(() => availableDays(planType), [planType])
  const [todayDay] = useState<Day>(() => getInitialToday(availableDays(planType)))
  const [activeMobileDay, setActiveMobileDay] = useState<Day>(() =>
    getInitialToday(availableDays(planType)),
  )
  const [parityFilter, setParityFilter] = useState<'all' | 'odd' | 'even'>('all')

  // Filter blocks by parity
  const filteredBlocks = useMemo(() => {
    return blocks.filter(b => {
      if (parityFilter === 'all') return true
      if (b.teachingWeekParity == null) return true
      if (parityFilter === 'odd') return b.teachingWeekParity === 1
      if (parityFilter === 'even') return b.teachingWeekParity === 0
      return true
    })
  }, [blocks, parityFilter])

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

  return (
    <div className="space-y-4">
      {/* Subheader Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 px-4 shadow-xs">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-zinc-500" />
          <span className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {planType === 'stacjonarne' ? 'Plan stacjonarny' : 'Zjazdy niestacjonarne'}
          </span>
          <span className="text-xs text-zinc-400">· {blocks.length} zajęć w planie</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Parity filter */}
          <div className="flex items-center rounded-lg bg-zinc-100 p-0.5 dark:bg-zinc-800 text-xs">
            <button
              onClick={() => setParityFilter('all')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                parityFilter === 'all'
                  ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-700 dark:text-zinc-100 font-medium'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              Wszystkie
            </button>
            <button
              onClick={() => setParityFilter('odd')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                parityFilter === 'odd'
                  ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-700 dark:text-zinc-100 font-medium'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              Nieparz. (A)
            </button>
            <button
              onClick={() => setParityFilter('even')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                parityFilter === 'even'
                  ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-700 dark:text-zinc-100 font-medium'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              Parz. (B)
            </button>
          </div>

          <button
            onClick={onOpenCustomize}
            className="hidden sm:flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <Filter className="h-3.5 w-3.5" />
            <span>Filtruj grupy</span>
          </button>
        </div>
      </div>

      {/* Mobile Day Switcher Tabs */}
      <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {days.map(day => {
          const count = blocksByDay[day].length
          const isSelected = activeMobileDay === day
          const isToday = todayDay === day

          return (
            <button
              key={day}
              onClick={() => setActiveMobileDay(day)}
              className={`flex-1 min-w-[70px] flex flex-col items-center py-2 px-1 rounded-xl border transition-all text-xs ${
                isSelected
                  ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 shadow-sm'
                  : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              <div className="flex items-center gap-1">
                <span className="font-semibold">{DAY_INFO[day][1]}</span>
                {isToday && (
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isSelected ? 'bg-amber-400' : 'bg-blue-600'
                    }`}
                  />
                )}
              </div>
              <span
                className={`text-[10px] mt-0.5 ${
                  isSelected ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-400'
                }`}
              >
                {count} {count === 1 ? 'zajęcia' : 'zajęć'}
              </span>
            </button>
          )
        })}
      </div>

      {/* Mobile Single Day View */}
      <div className="lg:hidden">
        {blocksByDay[activeMobileDay].length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 py-16 px-4 text-center">
            <Sparkles className="h-8 w-8 text-zinc-300 dark:text-zinc-600 mb-2" />
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Brak zajęć w tym dniu!
            </p>
            <p className="text-xs text-zinc-400 mt-1">
              Ciesz się wolnym czasem lub sprawdź inne dni.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {blocksByDay[activeMobileDay].map(block => (
              <BlockCard key={block.id} block={block} onClick={onSelectBlock} />
            ))}
          </div>
        )}
      </div>

      {/* Desktop Weekly Grid View */}
      <div className="hidden lg:grid grid-cols-5 gap-3.5 items-start">
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
              {/* Column Header */}
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

              {/* Day Blocks */}
              {dayBlocks.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-12 text-zinc-300 dark:text-zinc-700">
                  <span className="text-xs">Brak zajęć</span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {dayBlocks.map(block => (
                    <BlockCard key={block.id} block={block} onClick={onSelectBlock} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
