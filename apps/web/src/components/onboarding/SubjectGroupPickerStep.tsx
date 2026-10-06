import {
  type SubjectActivityOption,
  type SubjectCatalogItem,
  DAY_INFO,
  minutesToTime,
  roomLabel,
  labGroupsForExercise,
} from '@pk-planner/core'
import { CheckCircle2, Clock, EyeOff, Users } from 'lucide-react'

export const DAY_ORDER: Record<string, number> = {
  MON: 1,
  TUE: 2,
  WED: 3,
  THU: 4,
  FRI: 5,
  SAT: 6,
  SUN: 7,
}

export function formatOptionLabel(
  opt: SubjectActivityOption,
  mode: 'group' | 'time',
  activity?: string,
  subject?: string,
  isPaired?: boolean,
): string {
  const dayStr = opt.day && DAY_INFO[opt.day] ? DAY_INFO[opt.day][1] : opt.day || ''
  const timeStr =
    opt.start != null
      ? `${minutesToTime(opt.start)}-${minutesToTime(opt.start + (opt.duration || 90))}`
      : ''
  const isOnline =
    opt.room?.trim().toUpperCase() === 'ONLINE' ||
    opt.campus?.trim().toLowerCase() === 'zdalnie'
  const roomStr = isOnline
    ? 'zdalnie'
    : opt.room
      ? `s. ${roomLabel(opt.room)}`
      : ''
  const parityStr =
    opt.parity != null
      ? opt.parity === 0
        ? 'Tydz. A'
        : opt.parity === 1
          ? 'Tydz. B'
          : ''
      : ''

  const actKey = (activity || '').toLowerCase().trim()
  const isLab = ['l', 'lab', 'p', 'proj'].includes(actKey)
  const isEx = ['c', 'cw', 'cwiczenia', 'ćw'].includes(actKey)
  const isLecture = ['w', 'wyklad', 'wykład'].includes(actKey)

  const grMatch = opt.cohort?.match(/\/ gr\.?\s*(\d+)/i) || opt.group?.match(/(\d+)/)
  const grNum = grMatch ? Number(grMatch[1]) : null

  let displayGroup = opt.group
  if (grNum !== null) {
    if (isLab) {
      displayGroup = `Grupa GL ${grNum}`
    } else if (isEx && /^język obcy/i.test(subject || '')) {
      displayGroup = `Grupa językowa ${grNum}`
    } else if (isEx && isPaired) {
      const [firstLab, secondLab] = labGroupsForExercise(opt.cohort, grNum)
      displayGroup = `Grupa C${grNum} (GL ${firstLab}+${secondLab})`
    } else if (isEx) {
      displayGroup = `Grupa C${grNum}`
    } else if (isLecture) {
      displayGroup = `Grupa ${grNum}`
    }
  } else if (
    isLecture ||
    opt.group === 'Wszyscy' ||
    opt.group === opt.cohort ||
    /^(?:I{1,2}\s+stopień|Cyberpsychologia)/i.test(opt.group)
  ) {
    displayGroup = isLecture ? '' : 'Wszyscy'
  }

  const teacher = opt.teacher && opt.teacher !== 'Nieprzypisany' ? opt.teacher : ''

  if (mode === 'time') {
    const timeParts = [dayStr, timeStr].filter(Boolean).join(' ')
    if (displayGroup) {
      const details = [teacher, roomStr, parityStr].filter(Boolean).join(', ')
      return `${timeParts ? `${timeParts} - ` : ''}${displayGroup}${details ? ` (${details})` : ''}`
    }
    const details = [roomStr, parityStr].filter(Boolean).join(', ')
    const mainLabel = teacher || 'Wykład'
    return `${timeParts ? `${timeParts} - ` : ''}${mainLabel}${details ? ` (${details})` : ''}`
  } else {
    const timeParts = [dayStr, timeStr].filter(Boolean).join(' ')
    const extra = [timeParts, roomStr, parityStr].filter(Boolean).join(', ')
    if (displayGroup) {
      return `${displayGroup}${teacher ? ` - ${teacher}` : ''}${extra ? ` (${extra})` : ''}`
    }
    return `${teacher || 'Wykład'}${extra ? ` (${extra})` : ''}`
  }
}

interface SubjectGroupPickerStepProps {
  subjectCatalog: SubjectCatalogItem[]
  isPairedCohort: boolean
  selectedSubjects: Record<string, boolean>
  selectedGroups: Record<string, string>
  selectionViewMode: 'group' | 'time'
  setSelectionViewMode: (mode: 'group' | 'time') => void
  toggleSubject: (name: string) => void
  setGroupForActivity: (subject: string, activity: string, optId: string) => void
}

export function SubjectGroupPickerStep({
  subjectCatalog,
  isPairedCohort,
  selectedSubjects,
  selectedGroups,
  selectionViewMode,
  setSelectionViewMode,
  toggleSubject,
  setGroupForActivity,
}: SubjectGroupPickerStepProps) {
  return (
    <div className="space-y-4">
      {/* Informative helper & view mode toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-blue-200/80 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 text-xs text-blue-900 dark:text-blue-200">
        <p className="flex-1 leading-relaxed">
          Wybierz swoje grupy dla poszczególnych przedmiotów. Odznacz przedmioty, których nie
          realizujesz.
        </p>

        <div className="flex items-center gap-1 rounded-lg bg-white dark:bg-zinc-900 p-1 border border-zinc-200 dark:border-zinc-800 shrink-0 self-start sm:self-auto">
          <span className="text-[11px] font-medium text-zinc-500 px-1.5">Widok:</span>
          <button
            type="button"
            onClick={() => setSelectionViewMode('group')}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-all cursor-pointer ${
              selectionViewMode === 'group'
                ? 'bg-zinc-100 dark:bg-zinc-800 font-semibold text-zinc-900 dark:text-zinc-100 shadow-2xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Users className="h-3 w-3" />
            <span>Grupy</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectionViewMode('time')}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-all cursor-pointer ${
              selectionViewMode === 'time'
                ? 'bg-zinc-100 dark:bg-zinc-800 font-semibold text-zinc-900 dark:text-zinc-100 shadow-2xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Clock className="h-3 w-3" />
            <span>Terminy</span>
          </button>
        </div>
      </div>

      {/* Subject cards */}
      <div className="space-y-3">
        {subjectCatalog.map(subject => {
          const isSelected = selectedSubjects[subject.subject] !== false

          return (
            <div
              key={subject.subject}
              className={`rounded-xl border transition-all ${
                isSelected
                  ? 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xs'
                  : 'border-zinc-200/60 dark:border-zinc-800/40 bg-zinc-50/50 dark:bg-zinc-900/20 opacity-60'
              }`}
            >
              {/* Subject header */}
              <div className="p-3.5 flex items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800/60">
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => toggleSubject(subject.subject)}
                    className="cursor-pointer text-zinc-900 dark:text-zinc-100 shrink-0"
                  >
                    {isSelected ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-zinc-400" />
                    )}
                  </button>
                  <span
                    className={`font-semibold text-sm truncate ${
                      isSelected
                        ? 'text-zinc-900 dark:text-zinc-100'
                        : 'text-zinc-400 line-through'
                    }`}
                  >
                    {subject.subject}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => toggleSubject(subject.subject)}
                  className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 shrink-0 cursor-pointer"
                >
                  {isSelected ? 'Ukryj' : 'Włącz'}
                </button>
              </div>

              {/* Activity pickers */}
              {isSelected && (
                <div className="p-3.5 space-y-3 bg-zinc-50/30 dark:bg-zinc-900/10">
                  {subject.activities.map(act => {
                    const actKey = `${subject.subject}:${act.activity}`
                    const currentChosen = selectedGroups[actKey] || act.options[0]?.id

                    const sortedOptions = [...act.options].sort((a, b) => {
                      if (selectionViewMode === 'time') {
                        const dayDiff =
                          (DAY_ORDER[a.day || 'MON'] || 99) -
                          (DAY_ORDER[b.day || 'MON'] || 99)
                        if (dayDiff !== 0) return dayDiff
                        return (a.start ?? 0) - (b.start ?? 0)
                      }
                      return (a.group || '').localeCompare(b.group || '')
                    })

                    return (
                      <div
                        key={act.activity}
                        className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between"
                      >
                        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 sm:w-28 shrink-0">
                          {act.activityLabel}:
                        </span>

                        <select
                          value={currentChosen}
                          onChange={e =>
                            setGroupForActivity(
                              subject.subject,
                              act.activity,
                              e.target.value,
                            )
                          }
                          className="flex-1 min-w-0 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 py-1.5 px-2.5 focus:outline-hidden focus:ring-1 focus:ring-zinc-400 cursor-pointer shadow-2xs truncate"
                        >
                          {sortedOptions.map(opt => (
                            <option key={opt.id} value={opt.id}>
                              {formatOptionLabel(
                                opt,
                                selectionViewMode,
                                act.activity,
                                subject.subject,
                                isPairedCohort,
                              )}
                            </option>
                          ))}
                        </select>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
