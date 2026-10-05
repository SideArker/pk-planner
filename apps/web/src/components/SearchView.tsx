import { useMemo, useState } from 'react'
import {
  type Day,
  type ScheduleBlock,
  type ScheduleState,
  DAY_INFO,
  reservationTeachers,
  roomCampus,
  roomLabel,
} from '@pk-planner/core'
import { Building2, Calendar, Search, User } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { BlockCard } from './BlockCard'

interface SearchViewProps {
  state: ScheduleState | null
  onSelectBlock: (block: ScheduleBlock) => void
}

export function SearchView({ state, onSelectBlock }: SearchViewProps) {
  const [searchMode, setSearchMode] = useState<'teacher' | 'room'>('teacher')
  const [query, setQuery] = useState('')
  const [selectedEntity, setSelectedEntity] = useState<string>('')

  // Unique teachers sorted alphabetically
  const uniqueTeachers = useMemo(() => {
    if (!state) return []
    const set = new Set<string>()
    for (const b of state.blocks) {
      for (const t of reservationTeachers(b)) {
        if (t.trim()) set.add(t.trim())
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pl'))
  }, [state])

  // Unique rooms sorted
  const uniqueRooms = useMemo(() => {
    if (!state) return []
    const map = new Map<string, { code: string; label: string; campus: string | null }>()

    for (const b of state.blocks) {
      if (b.room && b.room.trim()) {
        const code = b.room.trim()
        if (!map.has(code)) {
          map.set(code, {
            code,
            label: roomLabel(code),
            campus: roomCampus(b, state.rooms),
          })
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label, 'pl'))
  }, [state])

  // Filter list by query
  const filteredList = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (searchMode === 'teacher') {
      if (!q) return uniqueTeachers
      return uniqueTeachers.filter(t => t.toLowerCase().includes(q))
    } else {
      if (!q) return uniqueRooms
      return uniqueRooms.filter(r => r.label.toLowerCase().includes(q) || (r.campus && r.campus.toLowerCase().includes(q)))
    }
  }, [searchMode, query, uniqueTeachers, uniqueRooms])

  // Get matching blocks for selected entity
  const matchingBlocks = useMemo(() => {
    if (!state || !selectedEntity) return []

    return state.blocks.filter(b => {
      if (!b.day || b.start == null) return false
      if (searchMode === 'teacher') {
        return reservationTeachers(b).includes(selectedEntity)
      } else {
        return b.room === selectedEntity || roomLabel(b.room) === selectedEntity
      }
    })
  }, [state, selectedEntity, searchMode])

  // Group matching blocks by day
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

    for (const b of matchingBlocks) {
      if (b.day && map[b.day]) {
        map[b.day].push(b)
      }
    }

    const days: Day[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
    for (const day of days) {
      map[day].sort((a, b) => (a.start ?? 0) - (b.start ?? 0))
    }

    return map
  }, [matchingBlocks])

  const visibleDays = useMemo(() => {
    const allDays: Day[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
    return allDays.filter(day => blocksByDay[day].length > 0)
  }, [blocksByDay])

  return (
    <div className="space-y-5">
      {/* Search Header Bar */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Wyszukiwarka zajęć i obłożenia sal
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Sprawdź kiedy dany wykładowca prowadzi zajęcia lub kiedy wybrana sala jest zajęta.
            </p>
          </div>

          {/* Teacher vs Room mode tabs */}
          <div className="flex items-center rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800 text-xs font-medium shrink-0">
            <button
              onClick={() => {
                setSearchMode('teacher')
                setSelectedEntity('')
                setQuery('')
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                searchMode === 'teacher'
                  ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-700 dark:text-zinc-50'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              <User className="h-3.5 w-3.5" />
              <span>Wykładowca</span>
            </button>
            <button
              onClick={() => {
                setSearchMode('room')
                setSelectedEntity('')
                setQuery('')
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                searchMode === 'room'
                  ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-700 dark:text-zinc-50'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              <span>Sala</span>
            </button>
          </div>
        </div>

        {/* Input & Selector */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-zinc-400 z-10" />
            <Input
              type="text"
              placeholder={
                searchMode === 'teacher'
                  ? 'Filtruj wykładowcę np. Szabat, Drożdż...'
                  : 'Filtruj salę np. L1, P1, 152...'
              }
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="sm:max-w-xs w-full">
            <select
              value={selectedEntity}
              onChange={e => setSelectedEntity(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-zinc-800"
            >
              <option value="">
                {searchMode === 'teacher' ? '-- Wybierz wykładowcę --' : '-- Wybierz salę --'}
              </option>
              {searchMode === 'teacher'
                ? (filteredList as string[]).map(t => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))
                : (filteredList as Array<{ code: string; label: string; campus: string | null }>).map(r => (
                    <option key={r.code} value={r.code}>
                      s. {r.label} {r.campus ? `(${r.campus})` : ''}
                    </option>
                  ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results View */}
      {!selectedEntity ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 py-16 px-4 text-center">
          <Calendar className="h-10 w-10 text-zinc-300 dark:text-zinc-600 mb-2" />
          <h3 className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">
            Wybierz {searchMode === 'teacher' ? 'wykładowcę' : 'salę'} z listy powyżej
          </h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm">
            Zobaczysz pełny tygodniowy grafik zajęć z podziałem na dni tygodnia i godziny.
          </p>
        </div>
      ) : matchingBlocks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 py-16 px-4 text-center">
          <p className="font-semibold text-sm text-zinc-700 dark:text-zinc-300">
            Brak zaplanowanych zajęć dla: {selectedEntity}
          </p>
          <p className="text-xs text-zinc-400 mt-1">Sala jest wolna lub brak terminów w systemie.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-zinc-500 px-1">
            <span>
              Wyniki dla:{' '}
              <strong className="text-zinc-800 dark:text-zinc-200">{selectedEntity}</strong>
            </span>
            <span>{matchingBlocks.length} zaplanowanych terminów</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleDays.map(day => (
              <div
                key={day}
                className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-3.5 space-y-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-zinc-200/60 dark:border-zinc-800">
                  <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                    {DAY_INFO[day][0]}
                  </span>
                  <span className="text-xs text-zinc-400">{blocksByDay[day].length}</span>
                </div>

                <div className="space-y-2">
                  {blocksByDay[day].map(block => (
                    <BlockCard key={block.id} block={block} onClick={onSelectBlock} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
