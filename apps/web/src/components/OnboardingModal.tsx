import { useMemo, useState } from 'react'
import {
  buildSubjectCatalog,
  exerciseGroupForLab,
  getCohortHierarchy,
  labGroupsForExercise,
  prefillScheduleSelections,
  DAY_INFO,
  minutesToTime,
  NOT_APPLICABLE_LABEL,
  NOT_APPLICABLE_VALUE,
  type CohortHierarchyNode,
  type Degree,
  type FieldOfStudy,
  type PlanType,
  type ScheduleState,
  type SubjectActivityOption,
} from '@pk-planner/core'
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  CheckCircle2,
  Clock,
  Code2,
  EyeOff,
  GraduationCap,
  Layers,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const DAY_ORDER: Record<string, number> = {
  MON: 1,
  TUE: 2,
  WED: 3,
  THU: 4,
  FRI: 5,
  SAT: 6,
  SUN: 7,
}

function formatOptionLabel(
  opt: SubjectActivityOption,
  mode: 'group' | 'time',
  activity?: string,
): string {
  const dayStr = opt.day && DAY_INFO[opt.day] ? DAY_INFO[opt.day][1] : opt.day || ''
  const timeStr =
    opt.start != null
      ? `${minutesToTime(opt.start)}-${minutesToTime(opt.start + (opt.duration || 90))}`
      : ''
  const roomStr = opt.room ? `s. ${opt.room}` : ''
  const parityStr = opt.parity != null ? (opt.parity === 1 ? 'Tydz. A' : 'Tydz. B') : ''

  const actKey = (activity || '').toLowerCase().trim()
  const isLab = ['l', 'lab', 'p', 'proj'].includes(actKey)
  const isEx = ['c', 'cw', 'cwiczenia', 'ćw'].includes(actKey)

  const grMatch = opt.cohort?.match(/\/ gr\.?\s*(\d+)/i) || opt.group?.match(/(\d+)/)
  const grNum = grMatch ? Number(grMatch[1]) : null

  let displayGroup = opt.group
  if (grNum !== null) {
    if (isLab) {
      displayGroup = `Grupa GL ${grNum}`
    } else if (isEx) {
      const [firstLab, secondLab] = labGroupsForExercise(opt.cohort, grNum)
      displayGroup = `Grupa C${grNum} (GL ${firstLab}+${secondLab})`
    }
  }

  if (mode === 'time') {
    const timeParts = [dayStr, timeStr].filter(Boolean).join(' ')
    const details = [opt.teacher, roomStr, parityStr].filter(Boolean).join(', ')
    return `${timeParts ? `${timeParts} - ` : ''}${displayGroup}${details ? ` (${details})` : ''}`
  } else {
    const timeParts = [dayStr, timeStr].filter(Boolean).join(' ')
    const extra = [timeParts, roomStr, parityStr].filter(Boolean).join(', ')
    return `${displayGroup} - ${opt.teacher}${extra ? ` (${extra})` : ''}`
  }
}

interface OnboardingModalProps {
  state: ScheduleState | null
  isOpen: boolean
  initialCohort?: string
  initialPlanType?: PlanType
  initialSelectedSubjects?: Record<string, boolean>
  initialSelectedGroups?: Record<string, string>
  onSave: (
    cohort: string,
    planType: PlanType,
    selectedSubjects: Record<string, boolean>,
    selectedGroups: Record<string, string>,
  ) => void
  onClose?: () => void
  isClosable?: boolean
}

export function OnboardingModal({
  state,
  isOpen,
  initialCohort = '',
  initialPlanType = 'stacjonarne',
  initialSelectedSubjects = {},
  initialSelectedGroups = {},
  onSave,
  onClose,
  isClosable = false,
}: OnboardingModalProps) {
  const [step, setStep] = useState<1 | 2>(initialCohort ? 2 : 1)
  const [selectionViewMode, setSelectionViewMode] = useState<'group' | 'time'>('group')

  // Hierarchy state
  const [selectedField, setSelectedField] = useState<FieldOfStudy>('Informatyka')
  const [selectedDegree, setSelectedDegree] = useState<Degree>('I stopień')
  const [selectedYear, setSelectedYear] = useState<number>(1)
  const [selectedCohort, setSelectedCohort] = useState(initialCohort)
  const [selectedPlanType, setSelectedPlanType] = useState<PlanType>(initialPlanType)

  const [selectedSubjects, setSelectedSubjects] = useState<Record<string, boolean>>(
    initialSelectedSubjects,
  )
  const [selectedGroups, setSelectedGroups] = useState<Record<string, string>>(
    initialSelectedGroups,
  )

  // Hierarchy data
  const hierarchy = useMemo(() => {
    if (!state) return { fields: { Informatyka: { 'I stopień': {}, 'II stopień': {} }, Cyberpsychologia: { 'I stopień': {}, 'II stopień': {} } }, allNodes: [] }
    return getCohortHierarchy(state)
  }, [state])

  // Available years for current field & degree
  const availableYears = useMemo(() => {
    const yearsMap = hierarchy.fields[selectedField]?.[selectedDegree] || {}
    return Object.keys(yearsMap)
      .map(Number)
      .sort((a, b) => a - b)
  }, [hierarchy, selectedField, selectedDegree])

  // Cohort nodes for current field, degree & year
  const currentCohorts = useMemo(() => {
    const yearsMap = hierarchy.fields[selectedField]?.[selectedDegree] || {}
    return yearsMap[selectedYear] || []
  }, [hierarchy, selectedField, selectedDegree, selectedYear])

  // Build subject catalog for selected cohort
  const subjectCatalog = useMemo(() => {
    if (!state || !selectedCohort) return []
    return buildSubjectCatalog(state, selectedCohort)
  }, [state, selectedCohort])

  if (!isOpen) return null

  const handleSelectCohortNode = (node: CohortHierarchyNode) => {
    setSelectedCohort(node.value)
    setSelectedPlanType(node.planType)

    // Pre-populate defaults matching student's chosen group
    if (state) {
      const baseToUse = node.cohortBase || node.value
      const catalog = buildSubjectCatalog(state, baseToUse)
      const { selectedSubjects: subs, selectedGroups: grps } = prefillScheduleSelections(
        catalog,
        node.groupNumber,
      )

      setSelectedSubjects(subs)
      setSelectedGroups(grps)
    }

    setStep(2)
  }

  const toggleSubject = (subjectName: string) => {
    setSelectedSubjects(prev => ({
      ...prev,
      [subjectName]: prev[subjectName] === false ? true : false,
    }))
  }

  const setGroupForActivity = (subjectName: string, activity: string, optionId: string) => {
    const key = `${subjectName}:${activity}`
    setSelectedGroups(prev => {
      const next = {
        ...prev,
        [key]: optionId,
      }

      // If user selected a laboratory/project group, automatically select the corresponding exercise group
      const actKey = activity.toLowerCase().trim()
      const isLabOrProj = ['l', 'lab', 'p', 'proj'].includes(actKey)

      if (isLabOrProj && optionId !== NOT_APPLICABLE_VALUE) {
        const subjectItem = subjectCatalog.find(s => s.subject === subjectName)
        const labAct = subjectItem?.activities.find(a => a.activity.toLowerCase().trim() === actKey)
        const selectedLabOpt = labAct?.options.find(o => o.id === optionId)

        if (selectedLabOpt) {
          const match =
            selectedLabOpt.cohort?.match(/\/ gr\.?\s*(\d+)/i) || selectedLabOpt.group?.match(/(\d+)/)
          const labNum = match ? Number(match[1]) : null

          if (labNum !== null) {
            const targetExNum = exerciseGroupForLab(selectedLabOpt.cohort, labNum)
            const exAct = subjectItem?.activities.find(a =>
              ['c', 'cw', 'cwiczenia', 'ćw'].includes(a.activity.toLowerCase().trim()),
            )

            if (exAct) {
              const matchingExOpt = exAct.options.find(o => {
                const exM = o.cohort?.match(/\/ gr\.?\s*(\d+)/i) || o.group?.match(/(\d+)/)
                return exM ? Number(exM[1]) === targetExNum : false
              })

              if (matchingExOpt) {
                const exKey = `${subjectName}:${exAct.activity}`
                next[exKey] = matchingExOpt.id
              }
            }
          }
        }
      }

      return next
    })
  }

  const handleFinish = () => {
    if (!selectedCohort) return
    onSave(selectedCohort, selectedPlanType, selectedSubjects, selectedGroups)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="shrink-0 border-b border-zinc-100 dark:border-zinc-800/80 px-5 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shrink-0">
              {step === 1 ? <GraduationCap className="h-5 w-5" /> : <Layers className="h-5 w-5" />}
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                {step === 1 ? 'Wybierz swój kierunek i rocznik' : 'Dostosuj swoje przedmioty i grupy'}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                {step === 1
                  ? 'Krok 1 z 2 - Wybierz kierunek, stopień i rok studiów'
                  : `Krok 2 z 2 - ${selectedCohort.replace(/[—–]/g, '-')}`}
              </p>
            </div>
          </div>

          {isClosable && onClose && (
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1.5 rounded-lg text-sm cursor-pointer shrink-0"
            >
              Zamknij
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-5 min-w-0">
          {step === 1 ? (
            <div className="space-y-6">
              {/* 1. Wybór kierunku (Informatyka vs Cyberpsychologia) */}
              <div className="space-y-2.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  1. Kierunek studiów
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedField('Informatyka')
                      setSelectedDegree('I stopień')
                      setSelectedYear(1)
                    }}
                    className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedField === 'Informatyka'
                        ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 shadow-sm'
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100'
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900 shrink-0">
                      <Code2 className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">Informatyka</div>
                      <p
                        className={`text-xs mt-0.5 ${
                          selectedField === 'Informatyka'
                            ? 'text-zinc-300 dark:text-zinc-600'
                            : 'text-zinc-500 dark:text-zinc-400'
                        }`}
                      >
                        I oraz II stopień studiów (wszystkie roczniki)
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedField('Cyberpsychologia')
                      setSelectedDegree('I stopień')
                      setSelectedYear(1)
                    }}
                    className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedField === 'Cyberpsychologia'
                        ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 shadow-sm'
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100'
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900 shrink-0">
                      <Brain className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">Cyberpsychologia</div>
                      <p
                        className={`text-xs mt-0.5 ${
                          selectedField === 'Cyberpsychologia'
                            ? 'text-zinc-300 dark:text-zinc-600'
                            : 'text-zinc-500 dark:text-zinc-400'
                        }`}
                      >
                        I stopień (aktualnie 1. rocznik)
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* 2. Wybór stopnia studiów (jeśli Informatyka) */}
              <div className="space-y-2.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  2. Stopień studiów
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDegree('I stopień')
                      setSelectedYear(1)
                    }}
                    className={`py-3 px-4 rounded-xl border text-center transition-all cursor-pointer font-medium text-xs sm:text-sm ${
                      selectedDegree === 'I stopień'
                        ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 shadow-sm'
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200'
                    }`}
                  >
                    <span>I stopień (Inżynierskie)</span>
                  </button>

                  <button
                    type="button"
                    disabled={selectedField === 'Cyberpsychologia'}
                    onClick={() => {
                      setSelectedDegree('II stopień')
                      setSelectedYear(1)
                    }}
                    className={`py-3 px-4 rounded-xl border text-center transition-all font-medium text-xs sm:text-sm ${
                      selectedField === 'Cyberpsychologia'
                        ? 'opacity-40 cursor-not-allowed border-zinc-200 dark:border-zinc-800 text-zinc-400'
                        : selectedDegree === 'II stopień'
                          ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 shadow-sm cursor-pointer'
                          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 cursor-pointer'
                    }`}
                  >
                    <span>II stopień (Magisterskie)</span>
                  </button>
                </div>
              </div>

              {/* 3. Wybór roku studiów (obliczany z semestrów: 1/2 -> Rok 1, 3/4 -> Rok 2 itd.) */}
              <div className="space-y-2.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  3. Rok studiów
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {availableYears.map(yearNum => {
                    const isYearActive = selectedYear === yearNum
                    const semLabel =
                      yearNum === 1
                        ? 'Semestr 1 / 2'
                        : yearNum === 2
                          ? 'Semestr 3 / 4'
                          : yearNum === 3
                            ? 'Semestr 5 / 6'
                            : 'Semestr 7'

                    return (
                      <button
                        key={yearNum}
                        type="button"
                        onClick={() => setSelectedYear(yearNum)}
                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                          isYearActive
                            ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 shadow-sm'
                            : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200'
                        }`}
                      >
                        <div className="font-semibold text-sm">Rok {yearNum}</div>
                        <div
                          className={`text-[11px] mt-0.5 ${
                            isYearActive ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-400'
                          }`}
                        >
                          {semLabel}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 4. Dostępne grupy / specjalności w tym roczniku */}
              <div className="space-y-2.5 pt-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    4. Wybierz grupę laboratoryjną / specjalność
                  </label>
                  <span className="text-[11px] text-zinc-400">
                    Grupa ćwiczeniowa dobierana automatycznie
                  </span>
                </div>

                {currentCohorts.length === 0 ? (
                  <div className="py-6 text-center text-xs text-zinc-400 border border-dashed rounded-xl">
                    Brak zaplanowanych grup dla tego wyboru.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {currentCohorts.map(c => {
                      const isSelected = selectedCohort === c.value

                      return (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => handleSelectCohortNode(c)}
                          className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 shadow-sm'
                              : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100'
                          }`}
                        >
                          <div>
                            <div className="font-semibold text-xs sm:text-sm">{c.label}</div>
                            <span
                              className={`inline-block text-[10px] mt-1 px-1.5 py-0.5 rounded font-mono ${
                                isSelected
                                  ? 'bg-zinc-800 text-zinc-200 dark:bg-zinc-200 dark:text-zinc-800'
                                  : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                              }`}
                            >
                              {c.sublabel || `Semestr ${c.semester} · ${c.planType}`}
                            </span>
                          </div>
                          <ArrowRight className="h-4 w-4 shrink-0 text-zinc-400" />
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Krok 2: Dostosowanie przedmiotów */
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                <div className="text-xs text-zinc-600 dark:text-zinc-400">
                  <p>
                    Wybierz swoją grupę lub oznacz jako{' '}
                    <strong className="text-zinc-900 dark:text-zinc-100">&lt;NIE DOTYCZY&gt;</strong> jeśli nie uczestniczysz w tych zajęciach.
                  </p>
                </div>

                <div className="flex items-center rounded-lg bg-zinc-200/70 dark:bg-zinc-800 p-0.5 text-xs shrink-0 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setSelectionViewMode('group')}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all cursor-pointer font-medium ${
                      selectionViewMode === 'group'
                        ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-700 dark:text-zinc-100 font-semibold'
                        : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                    }`}
                  >
                    <Users className="h-3.5 w-3.5" />
                    <span>Według grup</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectionViewMode('time')}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all cursor-pointer font-medium ${
                      selectionViewMode === 'time'
                        ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-700 dark:text-zinc-100 font-semibold'
                        : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                    }`}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    <span>Według terminu</span>
                  </button>
                </div>
              </div>

              {subjectCatalog.length === 0 ? (
                <div className="py-10 text-center text-sm text-zinc-500">
                  Brak przedmiotów dla wybranego rocznika.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {subjectCatalog.map(item => {
                    const isEnabled = selectedSubjects[item.subject] !== false

                    return (
                      <div
                        key={item.subject}
                        className={`rounded-2xl border p-3.5 sm:p-4 transition-all min-w-0 ${
                          isEnabled
                            ? 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs'
                            : 'border-zinc-200/60 dark:border-zinc-800/60 opacity-60 bg-zinc-50/40 dark:bg-zinc-950/40'
                        }`}
                      >
                        {/* Subject header & custom toggle switch */}
                        <div className="flex items-center justify-between gap-2.5 sm:gap-3 mb-3 pb-2 border-b border-zinc-100 dark:border-zinc-800/60 min-w-0">
                          <button
                            type="button"
                            onClick={() => toggleSubject(item.subject)}
                            className="flex items-center gap-2.5 sm:gap-3 text-left cursor-pointer group min-w-0 flex-1"
                          >
                            {/* Stylizowany przełącznik zamiast HTML checkboxa */}
                            <div
                              className={`h-5 w-9 shrink-0 rounded-full transition-colors relative flex items-center p-0.5 cursor-pointer ${
                                isEnabled
                                  ? 'bg-zinc-900 dark:bg-zinc-100'
                                  : 'bg-zinc-300 dark:bg-zinc-700'
                              }`}
                            >
                              <div
                                className={`h-4 w-4 rounded-full bg-white dark:bg-zinc-900 transition-transform ${
                                  isEnabled ? 'translate-x-4' : 'translate-x-0'
                                }`}
                              />
                            </div>

                            <span className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors line-clamp-2">
                              {item.subject}
                            </span>
                          </button>

                          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                            {!isEnabled && (
                              <Badge variant="outline" className="text-[10px] sm:text-[11px] text-zinc-400 shrink-0">
                                &lt;NIE DOTYCZY&gt;
                              </Badge>
                            )}
                            <span className="text-[11px] sm:text-xs text-zinc-400 shrink-0">
                              {item.activities.length}{' '}
                              {item.activities.length === 1 ? 'forma' : 'formy'}
                            </span>
                          </div>
                        </div>

                        {/* Activities rows */}
                        {isEnabled && item.activities.length > 0 && (
                          <div className="space-y-2.5">
                            {item.activities.map(act => {
                              const selectionKey = `${item.subject}:${act.activity}`
                              const selectedOptionId = selectedGroups[selectionKey]
                              const isActivityNotApplicable =
                                selectedOptionId === NOT_APPLICABLE_VALUE ||
                                selectedOptionId === NOT_APPLICABLE_LABEL

                              const sortedOptions = [...act.options].sort((a, b) => {
                                if (selectionViewMode === 'time') {
                                  const dayA = a.day ? (DAY_ORDER[a.day] ?? 99) : 99
                                  const dayB = b.day ? (DAY_ORDER[b.day] ?? 99) : 99
                                  if (dayA !== dayB) return dayA - dayB
                                  const startA = a.start ?? 9999
                                  const startB = b.start ?? 9999
                                  if (startA !== startB) return startA - startB
                                  return a.group.localeCompare(b.group, 'pl', { numeric: true })
                                }
                                return a.group.localeCompare(b.group, 'pl', { numeric: true })
                              })

                              return (
                                <div
                                  key={act.activity}
                                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl p-3 border transition-all text-xs min-w-0 ${
                                    isActivityNotApplicable
                                      ? 'bg-zinc-100/70 dark:bg-zinc-950/60 border-dashed border-zinc-300 dark:border-zinc-800 opacity-70'
                                      : 'bg-zinc-50/70 dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-800'
                                  }`}
                                >
                                  <div className="flex items-center justify-between sm:justify-start gap-2 shrink-0 sm:w-28">
                                    <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                                      {act.activityLabel}:
                                    </span>
                                    {isActivityNotApplicable && (
                                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium shrink-0">
                                        Pomijane
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2 min-w-0 w-full sm:flex-1">
                                    <select
                                      value={selectedOptionId || act.options[0]?.id || ''}
                                      onChange={e =>
                                        setGroupForActivity(item.subject, act.activity, e.target.value)
                                      }
                                      className="flex-1 min-w-0 w-full truncate rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-1 focus:ring-zinc-800 cursor-pointer"
                                    >
                                      {sortedOptions.map(opt => (
                                        <option key={opt.id} value={opt.id}>
                                          {formatOptionLabel(opt, selectionViewMode, act.activity)}
                                        </option>
                                      ))}
                                      {/* Opcja NIE DOTYCZY pod kazdymi zajeciami */}
                                      <option value={NOT_APPLICABLE_VALUE}>
                                        {NOT_APPLICABLE_LABEL} (Nie uczestniczę)
                                      </option>
                                    </select>

                                    <Button
                                      type="button"
                                      variant={isActivityNotApplicable ? 'secondary' : 'outline'}
                                      size="sm"
                                      onClick={() => {
                                        const nextValue = isActivityNotApplicable
                                          ? act.options[0]?.id || ''
                                          : NOT_APPLICABLE_VALUE
                                        setGroupForActivity(item.subject, act.activity, nextValue)
                                      }}
                                      title="Oznacz tę formę zajęć jako nie dotyczy"
                                      className="shrink-0 whitespace-nowrap text-[11px] h-7 px-2.5 cursor-pointer"
                                    >
                                      <EyeOff className="h-3 w-3 mr-1 shrink-0" />
                                      <span>
                                        {isActivityNotApplicable ? 'Przywróć' : 'Nie dotyczy'}
                                      </span>
                                    </Button>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="shrink-0 border-t border-zinc-100 dark:border-zinc-800 px-5 sm:px-6 py-3.5 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-950/50">
          {step === 2 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setStep(1)}
              className="flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Zmień rocznik</span>
            </Button>
          ) : (
            <div />
          )}

          {step === 1 ? (
            <Button
              type="button"
              onClick={() => setStep(2)}
              disabled={!selectedCohort}
              className="ml-auto cursor-pointer"
            >
              <span>Dalej</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleFinish}
              className="ml-auto cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Zatwierdź i pokaż plan</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
