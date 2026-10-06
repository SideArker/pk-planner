import type { BlockCollisionInfo } from '@pk-planner/core'
import { AlertTriangle } from 'lucide-react'

interface CollisionsBannerProps {
  collisions: Map<string, BlockCollisionInfo[]>
}

export function CollisionsBanner({ collisions }: CollisionsBannerProps) {
  if (collisions.size === 0) return null

  return (
    <div className="rounded-2xl border border-amber-300 dark:border-amber-900/80 bg-amber-50/90 dark:bg-amber-950/40 p-3.5 px-4 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-3 shadow-xs">
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold">
            Wykryto kolizje terminów w wybranym planie ({collisions.size}{' '}
            {collisions.size === 1 ? 'zajęcia kolidujące' : 'zajęć kolidujących'})
          </p>
          <p className="text-[11px] text-amber-700 dark:text-amber-300/80 mt-0.5 truncate">
            Niektóre z wybranych przedmiotów nakładają się na siebie w tych samych godzinach.
            Kliknij na podświetlone zajęcia, aby wybrać inną grupę.
          </p>
        </div>
      </div>
    </div>
  )
}
