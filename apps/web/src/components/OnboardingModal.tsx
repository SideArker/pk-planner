import { useMemo, useState } from 'react'
import {
  buildSubjectCatalog,
  extractUniqueCohorts,
  type PlanType,
  type ScheduleState,
} from '@pk-planner/core'
import { ArrowLeft, ArrowRight, Check, CheckCircle2, GraduationCap, Layers, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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
  const [cohortSearch, setCohortSearch] = useState('')
  const [selectedCohort, setSelectedCohort] = useState(initialCohort)
  const [selectedPlanType, setSelectedPlanType] = useState<PlanType>(initialPlanType)

  const [selectedSubjects, setSelectedSubjects] = useState<Record<string, boolean>>(
    initialSelectedSubjects,
  )
  const [selectedGroups, setSelectedGroups] = useState<Record<string, string>>(
    initialSelectedGroups,
  )

  // Extract cohorts from state
  const availableCohorts = useMemo(() => {
    if (!state) return []
    return extractUniqueCohorts(state)
  }, [state])

  // Filter cohorts by search
  const filteredCohorts = useMemo(() => {
    if (!cohortSearch.trim()) return availableCohorts
    const q = cohortSearch.toLowerCase().trim()
    return availableCohorts.filter(c => c.label.toLowerCase().includes(q))
  }, [availableCohorts, cohortSearch])

  // Build subject catalog for selected cohort
  const subjectCatalog = useMemo(() => {
    if (!state || !selectedCohort) return []
    return buildSubjectCatalog(state, selectedCohort)
  }, [state, selectedCohort])

  if (!isOpen) return null

  const handleCohortSelect = (cohortValue: string, planType: PlanType) => {
    setSelectedCohort(cohortValue)
    setSelectedPlanType(planType)

    // Pre-populate defaults for newly selected cohort
    if (state) {
      const catalog = buildSubjectCatalog(state, cohortValue)
      const subjects: Record<string, boolean> = {}
      const groups: Record<string, string> = {}

      for (const item of catalog) {
        subjects[item.subject] = true
        for (const act of item.activities) {
          if (act.options.length > 0) {
            const key = `${item.subject}:${act.activity}`
            // default to first option
            groups[key] = act.options[0].id
          }
        }
      }

      setSelectedSubjects(subjects)
      setSelectedGroups(groups)
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
    setSelectedGroups(prev => ({
      ...prev,
      [key]: optionId,
    }))
  }

  const handleFinish = () => {
    if (!selectedCohort) return
    onSave(selectedCohort, selectedPlanType, selectedSubjects, selectedGroups)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="border-b border-zinc-100 dark:border-zinc-800/80 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
              {step === 1 ? <GraduationCap className="h-5 w-5" /> : <Layers className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {step === 1 ? 'Wybierz swój kierunek i rocznik' : 'Dostosuj swoje przedmioty i grupy'}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {step === 1
                  ? 'Krok 1 z 2 · Wybierz grupę główną z planu uczelni'
                  : `Krok 2 z 2 · ${selectedCohort}`}
              </p>
            </div>
          </div>

          {isClosable && onClose && (
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1.5 rounded-lg text-sm"
            >
              Zamknij
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="max-h-[68vh] overflow-y-auto p-6">
          {step === 1 ? (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400 z-10" />
                <Input
                  type="text"
                  placeholder="Filtruj np. I stopień stac sem. 1..."
                  value={cohortSearch}
                  onChange={e => setCohortSearch(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>

              {availableCohorts.length === 0 ? (
                <div className="py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
                  Ładowanie roczników z planu uczelni...
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[50vh] overflow-y-auto pr-1">
                  {filteredCohorts.map(cohort => {
                    const isSelected = selectedCohort === cohort.value
                    return (
                      <button
                        key={cohort.value}
                        onClick={() => handleCohortSelect(cohort.value, cohort.planType)}
                        className={`flex items-start justify-between p-3.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 shadow-sm'
                            : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100'
                        }`}
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-snug">{cohort.label}</p>
                          <span
                            className={`inline-block text-[10px] px-1.5 py-0.5 rounded font-mono ${
                              isSelected
                                ? 'bg-zinc-800 text-zinc-200 dark:bg-zinc-200 dark:text-zinc-800'
                                : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400'
                            }`}
                          >
                            {cohort.planType}
                          </span>
                        </div>
                        {isSelected && <Check className="h-4 w-4 shrink-0 mt-0.5" />}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Wybierz które przedmioty masz w planie i do których grup ćwiczeniowych / laboratoryjnych należysz.
                Możesz to zmienić w każdej chwili.
              </p>

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
                        className={`rounded-xl border p-4 transition-all ${
                          isEnabled
                            ? 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50'
                            : 'border-zinc-200/50 dark:border-zinc-800/50 opacity-50 bg-transparent'
                        }`}
                      >
                        {/* Subject title & toggle */}
                        <div className="flex items-center justify-between gap-3 mb-3">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isEnabled}
                              onChange={() => toggleSubject(item.subject)}
                              className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900"
                            />
                            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                              {item.subject}
                            </span>
                          </label>
                          <span className="text-xs text-zinc-400">
                            {item.activities.length}{' '}
                            {item.activities.length === 1 ? 'forma' : 'formy'} zajęć
                          </span>
                        </div>

                        {/* Activities & group options */}
                        {isEnabled && item.activities.length > 0 && (
                          <div className="space-y-2.5 pt-1 pl-7">
                            {item.activities.map(act => {
                              const selectionKey = `${item.subject}:${act.activity}`
                              const selectedOptionId = selectedGroups[selectionKey]

                              return (
                                <div
                                  key={act.activity}
                                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg bg-white dark:bg-zinc-900 p-2.5 border border-zinc-200/80 dark:border-zinc-800 text-xs"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-zinc-800 dark:text-zinc-200 min-w-[85px]">
                                      {act.activityLabel}:
                                    </span>
                                  </div>

                                  <div className="flex-1 max-w-sm">
                                    {act.options.length === 1 ? (
                                      <div className="text-zinc-600 dark:text-zinc-400 text-xs">
                                        {act.options[0].group} · {act.options[0].teacher}
                                        {act.options[0].room ? ` · s. ${act.options[0].room}` : ''}
                                      </div>
                                    ) : (
                                      <select
                                        value={selectedOptionId || act.options[0]?.id || ''}
                                        onChange={e =>
                                          setGroupForActivity(item.subject, act.activity, e.target.value)
                                        }
                                        className="w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2.5 py-1 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-1 focus:ring-zinc-800"
                                      >
                                        {act.options.map(opt => (
                                          <option key={opt.id} value={opt.id}>
                                            {opt.group} — {opt.teacher} (
                                            {opt.day || ''} {opt.room ? `s. ${opt.room}` : ''})
                                          </option>
                                        ))}
                                      </select>
                                    )}
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
        <div className="border-t border-zinc-100 dark:border-zinc-800 px-6 py-4 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-950/50">
          {step === 2 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStep(1)}
              className="flex items-center gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Zmień rocznik</span>
            </Button>
          ) : (
            <div />
          )}

          {step === 1 ? (
            <Button
              onClick={() => setStep(2)}
              disabled={!selectedCohort}
              className="ml-auto"
            >
              <span>Dalej</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleFinish}
              className="ml-auto"
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
