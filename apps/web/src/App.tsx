import { useMemo, useState } from 'react'
import {
  type BlockOverride,
  type PlanType,
  type ScheduleBlock,
  resolveUserBlocks,
} from '@pk-planner/core'
import { AlertCircle, Calendar, RefreshCw } from 'lucide-react'
import { BlockDetailModal } from './components/BlockDetailModal'
import { Header } from './components/Header'
import { OnboardingModal } from './components/OnboardingModal'
import { ScheduleView } from './components/ScheduleView'
import { SearchView } from './components/SearchView'
import { SettingsModal } from './components/SettingsModal'
import { useScheduleData } from './hooks/useScheduleData'
import { useTheme } from './hooks/useTheme'
import { useUserSchedule } from './hooks/useUserSchedule'

export default function App() {
  const { theme, toggleTheme, setTheme } = useTheme()
  const { state, isLoading, error, lastUpdated, refresh } = useScheduleData()
  const {
    config,
    isConfigured,
    setCohort,
    updateSelections,
    setSubjectGroup,
    setBlockOverride,
    resetConfig,
  } = useUserSchedule()

  const [currentView, setCurrentView] = useState<'schedule' | 'search'>('schedule')
  const [selectedBlock, setSelectedBlock] = useState<ScheduleBlock | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false)

  // Resolve active schedule blocks based on user's cohort and chosen groups
  const userBlocks = useMemo(() => {
    if (!state || !config.cohort) return []
    return resolveUserBlocks(state, config)
  }, [state, config])

  // Handlers
  const handleSaveOnboarding = (
    cohort: string,
    planType: PlanType,
    selectedSubjects: Record<string, boolean>,
    selectedGroups: Record<string, string>,
  ) => {
    setCohort(cohort, planType)
    updateSelections(selectedSubjects, selectedGroups)
    setIsOnboardingOpen(false)
  }

  const handleSwitchGroup = (subject: string, activity: string, chosenOptionId: string) => {
    setSubjectGroup(subject, activity, chosenOptionId)
  }

  const handleSaveOverride = (blockId: string, override: BlockOverride) => {
    setBlockOverride(blockId, override)
  }

  // Show onboarding if not configured and not loading
  const showInitialOnboarding = !isConfigured && !isLoading && Boolean(state)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors">
      <Header
        currentView={currentView}
        onViewChange={setCurrentView}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onRefresh={refresh}
        isLoading={isLoading}
        lastUpdated={lastUpdated}
        cohort={config.cohort}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main className="flex-1 mx-auto max-w-7xl w-full p-4 sm:p-6 lg:p-8">
        {/* Error notification banner */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 p-4 text-xs sm:text-sm text-red-800 dark:text-red-300 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => refresh()}
              className="flex items-center gap-1.5 rounded-lg bg-red-100 dark:bg-red-900/60 px-3 py-1 font-medium hover:bg-red-200 dark:hover:bg-red-900 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Spróbuj ponownie</span>
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && !state ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-900 dark:border-zinc-100 border-t-transparent" />
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Pobieranie aktualnego planu zajęć...
            </p>
          </div>
        ) : !isConfigured ? (
          /* Empty / Unconfigured state */
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 mb-4 text-zinc-800 dark:text-zinc-200">
              <Calendar className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Witaj w PK Planer!
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mt-1.5 mb-6">
              Wybierz swój kierunek, semestr i grupy, aby wyświetlić przejrzysty, spersonalizowany plan zajęć.
            </p>
            <button
              onClick={() => setIsOnboardingOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-6 py-2.5 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-sm"
            >
              <span>Wybierz swój rocznik</span>
            </button>
          </div>
        ) : currentView === 'schedule' ? (
          /* Schedule Timetable */
          <ScheduleView
            blocks={userBlocks}
            planType={config.planType}
            onSelectBlock={setSelectedBlock}
            onOpenCustomize={() => setIsOnboardingOpen(true)}
          />
        ) : (
          /* Search view */
          <SearchView state={state} onSelectBlock={setSelectedBlock} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200/80 dark:border-zinc-800/80 bg-white/50 dark:bg-zinc-950/50 py-4 text-center text-xs text-zinc-400 dark:text-zinc-500">
        <p>PK Planer · Politechnika Krakowska</p>
      </footer>

      {/* Onboarding / Cohort Selection Modal */}
      <OnboardingModal
        state={state}
        isOpen={isOnboardingOpen || showInitialOnboarding}
        initialCohort={config.cohort}
        initialPlanType={config.planType}
        initialSelectedSubjects={config.selectedSubjects}
        initialSelectedGroups={config.selectedGroups}
        onSave={handleSaveOnboarding}
        onClose={() => setIsOnboardingOpen(false)}
        isClosable={isConfigured}
      />

      {/* Block Details Modal */}
      <BlockDetailModal
        block={selectedBlock}
        state={state}
        isOpen={Boolean(selectedBlock)}
        onClose={() => setSelectedBlock(null)}
        onSwitchGroup={handleSwitchGroup}
        onSaveOverride={handleSaveOverride}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        cohort={config.cohort}
        planType={config.planType}
        onChangeCohort={() => setIsOnboardingOpen(true)}
        onReconfigureGroups={() => setIsOnboardingOpen(true)}
        theme={theme}
        onSetTheme={setTheme}
        onReset={resetConfig}
        userBlocks={userBlocks}
      />
    </div>
  )
}
