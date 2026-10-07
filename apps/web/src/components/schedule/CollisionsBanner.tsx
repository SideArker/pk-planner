import type { BlockCollisionInfo } from '@pk-planner/core'
import { AlertTriangle } from 'lucide-react'

interface CollisionsBannerProps {
  collisions: Map<string, BlockCollisionInfo[]>
}

export function CollisionsBanner({ collisions }: CollisionsBannerProps) {
  if (collisions.size === 0) return null

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300">
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <AlertTriangle className="h-4 w-4 shrink-0 text-zinc-500 dark:text-zinc-400" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold">
            Wykryto kolizje terminów w wybranym planie ({collisions.size}{' '}
            {collisions.size === 1 ? 'zajęcia kolidujące' : 'zajęć kolidujących'})
          </p>
          <p className="mt-0.5 truncate text-[11px] text-zinc-500 dark:text-zinc-400">
            Niektóre z wybranych przedmiotów nakładają się na siebie w tych samych godzinach.
            Kliknij zajęcia oznaczone „Kolizja”, aby wybrać inną grupę.
          </p>
        </div>
      </div>
    </div>
  )
}
