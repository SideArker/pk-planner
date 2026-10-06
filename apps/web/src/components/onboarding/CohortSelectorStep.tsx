import type {
  CohortHierarchy,
  CohortHierarchyNode,
  Degree,
  FieldOfStudy,
} from '@pk-planner/core'
import { Brain, Code2, Users } from 'lucide-react'

interface CohortSelectorStepProps {
  hierarchy: CohortHierarchy
  selectedField: FieldOfStudy
  setSelectedField: (field: FieldOfStudy) => void
  selectedDegree: Degree
  setSelectedDegree: (deg: Degree) => void
  selectedYear: number
  setSelectedYear: (year: number) => void
  availableYears: number[]
  currentCohorts: CohortHierarchyNode[]
  selectedCohort: string
  onSelectCohortNode: (node: CohortHierarchyNode) => void
}

export function CohortSelectorStep({
  hierarchy,
  selectedField,
  setSelectedField,
  selectedDegree,
  setSelectedDegree,
  selectedYear,
  setSelectedYear,
  availableYears,
  currentCohorts,
  selectedCohort,
  onSelectCohortNode,
}: CohortSelectorStepProps) {
  return (
    <div className="space-y-6">
      {/* 1. Kierunek studiów */}
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
                Kierunek interdyscyplinarny
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* 2. Stopień studiów */}
      <div className="space-y-2.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          2. Stopień studiów
        </label>
        <div className="grid grid-cols-2 gap-3">
          {(['I stopień', 'II stopień'] as Degree[]).map(deg => {
            const hasData =
              Object.keys(hierarchy.fields[selectedField]?.[deg] || {}).length > 0
            return (
              <button
                key={deg}
                type="button"
                disabled={!hasData}
                onClick={() => {
                  setSelectedDegree(deg)
                  const firstYear = Number(
                    Object.keys(hierarchy.fields[selectedField]?.[deg] || {})[0] || 1,
                  )
                  setSelectedYear(firstYear)
                }}
                className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                  !hasData
                    ? 'opacity-40 cursor-not-allowed border-zinc-200 dark:border-zinc-800'
                    : selectedDegree === deg
                      ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 shadow-sm font-semibold'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100'
                }`}
              >
                <div className="text-sm font-semibold">{deg}</div>
                <div
                  className={`text-xs mt-0.5 ${
                    selectedDegree === deg
                      ? 'text-zinc-300 dark:text-zinc-600'
                      : 'text-zinc-400'
                  }`}
                >
                  {deg === 'I stopień' ? 'Inżynierskie / Licencjackie' : 'Magisterskie'}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* 3. Rok studiów */}
      {availableYears.length > 0 && (
        <div className="space-y-2.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            3. Rok studiów
          </label>
          <div className="flex gap-2 flex-wrap">
            {availableYears.map(yr => (
              <button
                key={yr}
                type="button"
                onClick={() => setSelectedYear(yr)}
                className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
                  selectedYear === yr
                    ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 shadow-sm font-semibold'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                {yr}. rok
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 4. Lista grup / roczników */}
      <div className="space-y-2.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          4. Wybierz swój semestr lub grupę
        </label>
        {currentCohorts.length === 0 ? (
          <div className="p-6 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-400">
            Brak zdefiniowanych grup dla wybranego stopnia i roku.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {currentCohorts.map(node => {
              const isSelected = selectedCohort === node.value
              return (
                <button
                  key={node.value}
                  type="button"
                  onClick={() => onSelectCohortNode(node)}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 shadow-sm'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{node.label}</div>
                    <div
                      className={`text-xs mt-0.5 truncate ${
                        isSelected
                          ? 'text-zinc-300 dark:text-zinc-600'
                          : 'text-zinc-400'
                      }`}
                    >
                      {node.planType === 'stacjonarne' ? 'Stacjonarne' : 'Niestacjonarne'}
                      {node.groupNumber ? ` · Grupa ${node.groupNumber}` : ''}
                    </div>
                  </div>
                  <Users
                    className={`h-4 w-4 shrink-0 ${
                      isSelected ? 'opacity-80' : 'text-zinc-400'
                    }`}
                  />
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
