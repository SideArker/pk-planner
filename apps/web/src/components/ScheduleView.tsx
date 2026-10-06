import { useMemo, useState } from 'react'
import {
  type Day,
  type PlanType,
  type ScheduleBlock,
  availableDays,
  DAY_INFO,
  detectScheduleCollisions,
  getTeachingWeekInfo,
  isBlockInWeekParity,
  minutesToTime,
} from '@pk-planner/core'
import { AlertTriangle, Calendar, Columns, Filter, LayoutGrid, Plus, Sparkles } from 'lucide-react'
import { BlockCard } from './BlockCard'

interface ScheduleViewProps {
  blocks: ScheduleBlock[]
  planType: PlanType
  onSelectBlock: (block: ScheduleBlock) => void
  onOpenCustomize: () => void
  onOpenAddCustom: () => void
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

interface ScheduleSlot {
  key: string
  start: number
  end: number
  startTime: string
  endTime: string
  slotIndex?: number
}

const STANDARD_PK_SLOTS = [
  { index: 1, start: 450, duration: 90, startTime: '07:30', endTime: '09:00' },
  { index: 2, start: 555, duration: 90, startTime: '09:15', endTime: '10:45' },
  { index: 3, start: 660, duration: 90, startTime: '11:00', endTime: '12:30' },
  { index: 4, start: 765, duration: 90, startTime: '12:45', endTime: '14:15' },
  { index: 5, start: 870, duration: 90, startTime: '14:30', endTime: '16:00' },
  { index: 6, start: 975, duration: 90, startTime: '16:15', endTime: '17:45' },
  { index: 7, start: 1080, duration: 90, startTime: '18:00', endTime: '19:30' },
  { index: 8, start: 1185, duration: 90, startTime: '19:45', endTime: '21:15' },
]

function getSlotKeyForBlock(block: ScheduleBlock): string {
  if (block.start == null) return ''
  for (const s of STANDARD_PK_SLOTS) {
    if (Math.abs(block.start - s.start) <= 35) {
      return `slot-${s.start}`
    }
  }
  return `custom-${block.start}`
}

export function ScheduleView({
  blocks,
  planType,
  onSelectBlock,
  onOpenCustomize,
  onOpenAddCustom,
}: ScheduleViewProps) {
  const days: Day[] = useMemo(() => availableDays(planType), [planType])
  const [todayDay] = useState<Day>(() => getInitialToday(availableDays(planType)))
  const [activeMobileDay, setActiveMobileDay] = useState<Day>(() =>
    getInitialToday(availableDays(planType)),
  )
  const [desktopLayout, setDesktopLayout] = useState<'columns' | 'grid'>(() => {
    const saved = localStorage.getItem('pk_planner_desktop_layout')
    return saved === 'grid' ? 'grid' : 'columns'
  })

  const handleSetLayout = (newLayout: 'columns' | 'grid') => {
    setDesktopLayout(newLayout)
    localStorage.setItem('pk_planner_desktop_layout', newLayout)
  }

  const currentWeek = useMemo(() => getTeachingWeekInfo(), [])
  const [parityFilter, setParityFilter] = useState<'all' | 'current' | 'A' | 'B'>('all')

  // Filter blocks by parity
  const filteredBlocks = useMemo(() => {
    return blocks.filter(b => {
      if (parityFilter === 'all') return true
      const targetParity = parityFilter === 'current' ? currentWeek.parityLabel : parityFilter
      return isBlockInWeekParity(b, targetParity)
    })
  }, [blocks, parityFilter, currentWeek])

  // Collisions detection (overlapping blocks on same day & parity)
  const collisions = useMemo(() => {
    return detectScheduleCollisions(filteredBlocks)
  }, [filteredBlocks])
  const hasAnyCollisions = collisions.size > 0

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

  // Standard PK slots cover the full academic day 07:30 - 21:15 (bloki 1..8)
  const activeSlots = useMemo<ScheduleSlot[]>(() => {
    const standardSlots: ScheduleSlot[] = STANDARD_PK_SLOTS.map(s => ({
      key: `slot-${s.start}`,
      start: s.start,
      end: s.start + s.duration,
      startTime: s.startTime,
      endTime: s.endTime,
      slotIndex: s.index,
    }))

    const valid = filteredBlocks.filter(b => b.start != null)
    const customSlots: ScheduleSlot[] = []
    const seenCustom = new Set<number>()

    for (const b of valid) {
      const fitsStandard = STANDARD_PK_SLOTS.some(s => Math.abs(b.start! - s.start) <= 35)
      if (!fitsStandard && !seenCustom.has(b.start!)) {
        seenCustom.add(b.start!)
        const dur = b.duration || 90
        customSlots.push({
          key: `custom-${b.start}`,
          start: b.start!,
          end: b.start! + dur,
          startTime: minutesToTime(b.start!),
          endTime: minutesToTime(b.start! + dur),
        })
      }
    }

    return [...standardSlots, ...customSlots].sort((a, b) => a.start - b.start)
  }, [filteredBlocks])

  return (
    <div className="space-y-4">
      {/* Subheader Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 px-4 shadow-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <Calendar className="h-4 w-4 text-zinc-500" />
          <span className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {planType === 'stacjonarne' ? 'Plan stacjonarny' : 'Zjazdy niestacjonarne'}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 font-medium text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700/60">
            Bieżący: Tydzień {currentWeek.parityLabel} ({currentWeek.dateRangeLabel})
          </span>
          <span className="text-xs text-zinc-400">· {filteredBlocks.length} zajęć</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Parity filter: Wszystkie (domyślne) | Bieżący | Tydzień A | Tydzień B */}
          <div className="flex items-center rounded-lg bg-zinc-100 p-0.5 dark:bg-zinc-800 text-xs">
            <button
              onClick={() => setParityFilter('all')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                parityFilter === 'all'
                  ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-700 dark:text-zinc-100 font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              Wszystkie
            </button>
            <button
              onClick={() => setParityFilter('current')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                parityFilter === 'current'
                  ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-700 dark:text-zinc-100 font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              Bieżący ({currentWeek.parityLabel})
            </button>
            <button
              onClick={() => setParityFilter('A')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                parityFilter === 'A'
                  ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-700 dark:text-zinc-100 font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              Tydzień A
            </button>
            <button
              onClick={() => setParityFilter('B')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                parityFilter === 'B'
                  ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-700 dark:text-zinc-100 font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              Tydzień B
            </button>
          </div>

          {/* Desktop layout toggle: Karty vs Pełna siatka (7:30 - 21:00) */}
          <div className="hidden sm:flex items-center rounded-lg bg-zinc-100 p-0.5 dark:bg-zinc-800 text-xs">
            <button
              onClick={() => handleSetLayout('columns')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                desktopLayout === 'columns'
                  ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-700 dark:text-zinc-100 font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
              title="Widok kart"
            >
              <Columns className="h-3.5 w-3.5" />
              <span>Karty</span>
            </button>
            <button
              onClick={() => handleSetLayout('grid')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                desktopLayout === 'grid'
                  ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-700 dark:text-zinc-100 font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
              title="Pełna siatka godzinowa 7:30 - 21:00"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Siatka (7:30 - 21:00)</span>
            </button>
          </div>

          <button
            onClick={onOpenCustomize}
            className="hidden sm:flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <Filter className="h-3.5 w-3.5" />
            <span>Filtruj grupy</span>
          </button>

          <button
            onClick={onOpenAddCustom}
            className="flex items-center gap-1.5 rounded-lg border border-purple-200 dark:border-purple-800/80 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 px-3 py-1 text-xs font-medium transition-colors cursor-pointer shadow-2xs"
            title="Dodaj własne zajęcia do planu"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Dodaj zajęcia</span>
          </button>
        </div>
      </div>

      {/* Collision Warning Banner */}
      {hasAnyCollisions && (
        <div className="rounded-2xl border border-amber-300 dark:border-amber-900/80 bg-amber-50/90 dark:bg-amber-950/40 p-3.5 px-4 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <span className="font-semibold">
                Wykryto kolizję terminów ({collisions.size} {collisions.size === 1 ? 'zajęcia' : 'zajęć'} nachodzi na siebie)!
              </span>{' '}
              <span className="text-amber-800 dark:text-amber-300">
                Kafelki z żółtym obramowaniem kolidują w czasie. Sprawdź swój plan lub zmień grupę w filtrach.
              </span>
            </div>
          </div>
          <button
            onClick={onOpenCustomize}
            className="shrink-0 px-2.5 py-1 rounded-lg bg-amber-200/80 hover:bg-amber-200 text-amber-950 dark:bg-amber-900/60 dark:hover:bg-amber-900 dark:text-amber-100 font-semibold text-[11px] transition-colors cursor-pointer"
          >
            Filtruj grupy
          </button>
        </div>
      )}

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
            <button
              onClick={onOpenAddCustom}
              className="mt-3.5 inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Dodaj własne zajęcia</span>
            </button>
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
                onClick={onSelectBlock}
              />
            ))}
          </div>
        )}
      </div>

      {/* Desktop Weekly View */}
      {filteredBlocks.length === 0 ? (
        <div className="hidden lg:flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 py-16 px-4 text-center">
          <Sparkles className="h-8 w-8 text-zinc-300 dark:text-zinc-600 mb-2" />
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Brak zajęć w wybranym filtrze tygodnia!
          </p>
          <p className="text-xs text-zinc-400 mt-1">
            Zmień filtr powyżej lub dostosuj swoje grupy w ustawieniach.
          </p>
          <button
            onClick={onOpenAddCustom}
            className="mt-3.5 inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Dodaj własne zajęcia</span>
          </button>
        </div>
      ) : desktopLayout === 'grid' ? (
        /* Aligned Timetable Grid */
        <div className="hidden lg:flex flex-col gap-2.5">
          {/* Header Row */}
          <div className="flex items-center gap-2.5 sticky top-2 z-20">
            <div className="w-24 sm:w-28 shrink-0 p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm flex items-center justify-center text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider shadow-xs">
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
                      ? 'border-blue-300 dark:border-blue-900 bg-blue-50/80 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100'
                      : 'border-zinc-200/80 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 text-zinc-900 dark:text-zinc-100'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span
                      className={`text-xs sm:text-sm font-semibold truncate ${
                        isToday ? 'font-bold' : ''
                      }`}
                    >
                      {DAY_INFO[day][0]}
                    </span>
                    {isToday && (
                      <span className="text-[10px] bg-blue-100 dark:bg-blue-900/80 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded font-semibold shrink-0">
                        Dziś
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-zinc-400 font-mono shrink-0 ml-1">{count}</span>
                </div>
              )
            })}
          </div>

          {/* Time Slot Rows */}
          <div className="space-y-2.5">
            {activeSlots.map(slot => (
              <div key={slot.key} className="flex items-stretch gap-2.5">
                {/* Time Badge Cell */}
                <div className="w-24 sm:w-28 shrink-0 flex flex-col items-center justify-center p-2 rounded-xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 text-center select-none min-h-[92px]">
                  <span className="text-xs font-semibold font-mono text-zinc-800 dark:text-zinc-200">
                    {slot.startTime}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono mt-0.5">
                    {slot.endTime}
                  </span>
                  {slot.slotIndex && (
                    <span className="mt-1 text-[9px] font-mono text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.2 rounded">
                      blok {slot.slotIndex}
                    </span>
                  )}
                </div>

                {/* Day Cells */}
                {days.map(day => {
                  const cellBlocks = filteredBlocks.filter(
                    b => b.day === day && getSlotKeyForBlock(b) === slot.key,
                  )
                  const isToday = todayDay === day

                  return (
                    <div
                      key={day}
                      className={`flex-1 min-w-0 rounded-xl transition-colors ${
                        isToday ? 'bg-blue-50/15 dark:bg-blue-950/10' : ''
                      }`}
                    >
                      {cellBlocks.length === 0 ? (
                        <div className="h-full min-h-[92px] rounded-xl border border-dashed border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/20 dark:bg-zinc-900/10 hover:border-zinc-300 dark:hover:border-zinc-700/60 transition-colors" />
                      ) : (
                        <div className="flex flex-col gap-2">
                          {cellBlocks.map(block => (
                            <BlockCard
                              key={block.id}
                              block={block}
                              collisionInfo={collisions.get(block.id)}
                              currentParity={currentWeek.parityLabel}
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
            ))}
          </div>
        </div>
      ) : (
        /* Classic Columns View */
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
                        currentParity={currentWeek.parityLabel}
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
      )}
    </div>
  )
}
