import { Plus, Sparkles } from 'lucide-react'

interface EmptyScheduleStateProps {
  onOpenAddCustom: () => void
}

export function EmptyScheduleState({ onOpenAddCustom }: EmptyScheduleStateProps) {
  return (
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
  )
}
