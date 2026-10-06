import { useMemo, useState } from 'react'
import {
  buildSubjectCatalog,
  detectIsPairedCohort,
  exerciseGroupForLab,
  getCohortHierarchy,
  prefillScheduleSelections,
  NOT_APPLICABLE_VALUE,
  type CohortHierarchyNode,
  type Degree,
  type FieldOfStudy,
  type PlanType,
  type ScheduleState,
} from '@pk-planner/core'
import { ArrowLeft, ArrowRight, CheckCircle2, GraduationCap, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CohortSelectorStep } from './onboarding/CohortSelectorStep'
import { SubjectGroupPickerStep } from './onboarding/SubjectGroupPickerStep'

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
    if (!state) {
      return {
        fields: {
          Informatyka: { 'I stopień': {}, 'II stopień': {} },
          Cyberpsychologia: { 'I stopień': {}, 'II stopień': {} },
        },
        allNodes: [],
      }
    }
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

  const isPairedCohort = useMemo(() => detectIsPairedCohort(subjectCatalog), [subjectCatalog])

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
      const next = { ...prev, [key]: optionId }

      // Paired cohort auto-sync: Lab -> Exercise
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
            <CohortSelectorStep
              hierarchy={hierarchy}
              selectedField={selectedField}
              setSelectedField={setSelectedField}
              selectedDegree={selectedDegree}
              setSelectedDegree={setSelectedDegree}
              selectedYear={selectedYear}
              setSelectedYear={setSelectedYear}
              availableYears={availableYears}
              currentCohorts={currentCohorts}
              selectedCohort={selectedCohort}
              onSelectCohortNode={handleSelectCohortNode}
            />
          ) : (
            <SubjectGroupPickerStep
              subjectCatalog={subjectCatalog}
              isPairedCohort={isPairedCohort}
              selectedSubjects={selectedSubjects}
              selectedGroups={selectedGroups}
              selectionViewMode={selectionViewMode}
              setSelectionViewMode={setSelectionViewMode}
              toggleSubject={toggleSubject}
              setGroupForActivity={setGroupForActivity}
            />
          )}
        </div>

        {/* Modal Footer */}
        <div className="shrink-0 border-t border-zinc-100 dark:border-zinc-800/80 px-5 sm:px-6 py-3.5 flex items-center justify-between gap-3 bg-zinc-50/50 dark:bg-zinc-950/40">
          {step === 2 ? (
            <Button variant="outline" size="sm" onClick={() => setStep(1)} className="gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              <span>Zmień rocznik</span>
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            {step === 1 ? (
              <Button
                size="sm"
                disabled={!selectedCohort}
                onClick={() => setStep(2)}
                className="gap-1.5"
              >
                <span>Dalej</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button size="sm" onClick={handleFinish} className="gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                <span>Zapisz i pokaż plan</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
