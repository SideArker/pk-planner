import {
  type ScheduleBlock,
  minutesToTime,
  roomLabel,
  teacherDisplay,
} from '@pk-planner/core'
import { Clock, MapPin, MoreVertical, User } from 'lucide-react'

interface BlockCardProps {
  block: ScheduleBlock
  onClick: (block: ScheduleBlock) => void
  isCompact?: boolean
}

const ACTIVITY_STYLES: Record<string, { badge: string; border: string; bg: string }> = {
  w: {
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200 dark:border-blue-800/60',
    border: 'border-l-blue-500',
    bg: 'hover:bg-blue-50/40 dark:hover:bg-blue-950/20',
  },
  c: {
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
    border: 'border-l-emerald-500',
    bg: 'hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20',
  },
  cw: {
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
    border: 'border-l-emerald-500',
    bg: 'hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20',
  },
  l: {
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
    border: 'border-l-amber-500',
    bg: 'hover:bg-amber-50/40 dark:hover:bg-amber-950/20',
  },
  lab: {
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
    border: 'border-l-amber-500',
    bg: 'hover:bg-amber-50/40 dark:hover:bg-amber-950/20',
  },
  p: {
    badge: 'bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border-purple-200 dark:border-purple-800/60',
    border: 'border-l-purple-500',
    bg: 'hover:bg-purple-50/40 dark:hover:bg-purple-950/20',
  },
  s: {
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border-rose-200 dark:border-rose-800/60',
    border: 'border-l-rose-500',
    bg: 'hover:bg-rose-50/40 dark:hover:bg-rose-950/20',
  },
}

const DEFAULT_STYLE = {
  badge: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700',
  border: 'border-l-zinc-500',
  bg: 'hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30',
}

export function BlockCard({ block, onClick, isCompact = false }: BlockCardProps) {
  const actKey = (block.activity || '').toLowerCase().trim()
  const style = ACTIVITY_STYLES[actKey] || DEFAULT_STYLE

  const startTime = minutesToTime(block.start)
  const endTime = minutesToTime((block.start ?? 0) + (block.duration || 90))
  const teacher = teacherDisplay(block)
  const room = roomLabel(block.room)

  const parityLabel =
    block.frequency === 'co_2_tygodnie' || block.teachingWeekParity != null
      ? block.teachingWeekParity === 1
        ? 'nieparz.'
        : block.teachingWeekParity === 0
          ? 'parz.'
          : 'co 2 tyg.'
      : null

  return (
    <button
      onClick={() => onClick(block)}
      className={`group relative w-full text-left rounded-xl border border-zinc-200/90 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/90 p-3 transition-all duration-150 hover:shadow-md border-l-4 ${style.border} ${style.bg} cursor-pointer`}
    >
      <div className="flex items-start justify-between gap-1.5 mb-1.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold border ${style.badge}`}
          >
            {block.activity?.toUpperCase() || 'ZAJĘCIA'}
          </span>
          {parityLabel && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              {parityLabel}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-500 dark:text-zinc-400 shrink-0">
          <Clock className="h-3 w-3" />
          <span>
            {startTime}–{endTime}
          </span>
        </div>
      </div>

      <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-snug group-hover:text-zinc-700 dark:group-hover:text-zinc-200">
        {block.subject}
      </h3>

      <div className="mt-2 flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
        {teacher ? (
          <div className="flex items-center gap-1 truncate max-w-[65%]">
            <User className="h-3 w-3 shrink-0 text-zinc-400" />
            <span className="truncate">{teacher}</span>
          </div>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-1 shrink-0 font-medium text-zinc-700 dark:text-zinc-300">
          <MapPin className="h-3 w-3 text-zinc-400" />
          <span>{room ? `s. ${room}` : block.modality === 'online' ? 'Online' : 'Bez sali'}</span>
        </div>
      </div>

      {block.notes && !isCompact && (
        <p className="mt-1.5 text-[11px] text-zinc-400 dark:text-zinc-500 line-clamp-1 italic">
          {block.notes}
        </p>
      )}

      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
        <MoreVertical className="h-3.5 w-3.5" />
      </div>
    </button>
  )
}
