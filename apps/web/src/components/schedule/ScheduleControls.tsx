import type { PlanType, TeachingWeekInfo } from '@pk-planner/core'
import { Columns, Filter, LayoutGrid, Plus } from 'lucide-react'

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
    <div className="flex flex-col gap-3 border-b border-zinc-200 pb-3 dark:border-zinc-800 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0 text-xs text-zinc-500 dark:text-zinc-400">
        <span className="font-medium text-zinc-700 dark:text-zinc-300">
          {planType === 'stacjonarne' ? 'Plan stacjonarny' : 'Zjazdy niestacjonarne'}
        </span>
        <span className="mx-2 text-zinc-300 dark:text-zinc-600">·</span>
        <span>Tydzień {currentWeek.parityLabel} ({currentWeek.dateRangeLabel})</span>
        <span className="mx-2 text-zinc-300 dark:text-zinc-600">·</span>
        <span>{blocksCount} zajęć</span>
      </div>

      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <div className="flex max-w-full items-center overflow-x-auto rounded-md border border-zinc-200 bg-zinc-100 p-0.5 text-xs dark:border-zinc-700 dark:bg-zinc-800" role="group" aria-label="Filtr tygodnia">
          {(
            [
              { id: 'all', label: 'Wszystkie' },
              { id: 'current', label: 'Bieżący' },
              { id: 'A', label: 'Tydzień A' },
              { id: 'B', label: 'Tydzień B' },
            ] as const
          ).map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onParityFilterChange(tab.id)}
              aria-pressed={parityFilter === tab.id}
              className={`shrink-0 rounded-sm px-2.5 py-1.5 transition-colors cursor-pointer ${
                parityFilter === tab.id
                  ? 'bg-white font-semibold text-zinc-900 shadow-xs dark:bg-zinc-700 dark:text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="hidden items-center rounded-md border border-zinc-200 p-0.5 dark:border-zinc-700 sm:flex" role="group" aria-label="Widok planu">
          <button
            type="button"
            onClick={() => onLayoutChange('columns')}
            aria-label="Widok kart"
            aria-pressed={desktopLayout === 'columns'}
            title="Widok kart"
            className={`rounded-sm p-1.5 transition-colors cursor-pointer ${
              desktopLayout === 'columns'
                ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
            }`}
          >
            <Columns className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onLayoutChange('grid')}
            aria-label="Siatka godzinowa"
            aria-pressed={desktopLayout === 'grid'}
            title="Siatka godzinowa"
            className={`rounded-sm p-1.5 transition-colors cursor-pointer ${
              desktopLayout === 'grid'
                ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenCustomize}
          className="inline-flex items-center gap-1.5 rounded-sm px-2 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 cursor-pointer"
          title="Filtruj grupy"
        >
          <Filter className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Filtruj grupy</span>
        </button>

        <button
          type="button"
          onClick={onOpenAddCustom}
          className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300 cursor-pointer"
          title="Dodaj własne zajęcia do planu"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Dodaj zajęcia</span>
        </button>
      </div>
    </div>
  )
}
