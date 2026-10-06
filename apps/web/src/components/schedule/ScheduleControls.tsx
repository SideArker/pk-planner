import type { PlanType, TeachingWeekInfo } from '@pk-planner/core'
import { Calendar, Columns, Filter, LayoutGrid, Plus } from 'lucide-react'

export type ParityFilterType = 'all' | 'current' | 'A' | 'B'

interface ScheduleControlsProps {
  planType: PlanType
  currentWeek: TeachingWeekInfo
  blocksCount: number
  parityFilter: ParityFilterType
  onParityFilterChange: (filter: ParityFilterType) => void
  desktopLayout: 'columns' | 'grid'
  onLayoutChange: (layout: 'columns' | 'grid') => void
  onOpenCustomize: () => void
  onOpenAddCustom: () => void
}

export function ScheduleControls({
  planType,
  currentWeek,
  blocksCount,
  parityFilter,
  onParityFilterChange,
  desktopLayout,
  onLayoutChange,
  onOpenCustomize,
  onOpenAddCustom,
}: ScheduleControlsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 px-4 shadow-xs">
      <div className="flex items-center gap-2 flex-wrap">
        <Calendar className="h-4 w-4 text-zinc-500" />
        <span className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {planType === 'stacjonarne' ? 'Plan stacjonarny' : 'Zjazdy niestacjonarne'}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 font-medium text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700/60">
          Bieżący: Tydzień {currentWeek.parityLabel} ({currentWeek.dateRangeLabel})
        </span>
        <span className="text-xs text-zinc-400">· {blocksCount} zajęć</span>
      </div>

      <div className="flex items-center gap-2">
        {/* Parity filter */}
        <div className="flex items-center rounded-lg bg-zinc-100 p-0.5 dark:bg-zinc-800 text-xs">
          {(
            [
              { id: 'all', label: 'Wszystkie' },
              { id: 'current', label: `Bieżący (${currentWeek.parityLabel})` },
              { id: 'A', label: 'Tydzień A' },
              { id: 'B', label: 'Tydzień B' },
            ] as const
          ).map(tab => (
            <button
              key={tab.id}
              onClick={() => onParityFilterChange(tab.id)}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                parityFilter === tab.id
                  ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-700 dark:text-zinc-100 font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Desktop layout toggle: Karty vs Siatka */}
        <div className="hidden sm:flex items-center rounded-lg bg-zinc-100 p-0.5 dark:bg-zinc-800 text-xs">
          <button
            onClick={() => onLayoutChange('columns')}
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
            onClick={() => onLayoutChange('grid')}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
              desktopLayout === 'grid'
                ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-700 dark:text-zinc-100 font-semibold'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
            title="Siatka godzinowa"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Siatka</span>
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
  )
}
