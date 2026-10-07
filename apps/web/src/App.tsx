import { useMemo, useState } from "react";
import {
  type BlockOverride,
  type PlanType,
  type ScheduleBlock,
  cohortParts,
  exerciseGroupForLab,
  resolveUserBlocks,
} from "@pk-planner/core";
import { AlertCircle, Calendar, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddCustomBlockModal } from "./components/AddCustomBlockModal";
import { BlockDetailModal } from "./components/BlockDetailModal";
import { Header } from "./components/Header";
import { OnboardingModal } from "./components/OnboardingModal";
import { ScheduleView } from "./components/ScheduleView";
import { SearchView } from "./components/SearchView";
import { SettingsModal } from "./components/SettingsModal";
import { useScheduleData } from "./hooks/useScheduleData";
import { useAndroidDownload } from "./hooks/useAndroidDownload";
import { useTheme } from "./hooks/useTheme";
import { useUserSchedule } from "./hooks/useUserSchedule";

export default function App() {
  const { theme, resolvedTheme, toggleTheme, setTheme } = useTheme();
  const { state, isLoading, error, lastUpdated, refresh } = useScheduleData();
  const androidDownloadUrl = useAndroidDownload();
  const {
    config,
    isConfigured,
    saveAllConfig,
    setSubjectGroup,
    setBlockOverride,
    addCustomBlock,
    removeCustomBlock,
    resetConfig,
    updateSelections,
  } = useUserSchedule();

  const [currentView, setCurrentView] = useState<"schedule" | "search">(
    "schedule",
  );
  const [selectedBlock, setSelectedBlock] = useState<ScheduleBlock | null>(
    null,
  );
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isAddCustomOpen, setIsAddCustomOpen] = useState(false);

  // Resolve active schedule blocks based on user's cohort and chosen groups
  const userBlocks = useMemo(() => {
    if (!state) return [];
    return resolveUserBlocks(state, config);
  }, [state, config]);

  // Handlers
  const handleSaveOnboarding = (
    cohort: string,
    planType: PlanType,
    selectedSubjects: Record<string, boolean>,
    selectedGroups: Record<string, string>,
  ) => {
    saveAllConfig(cohort, planType, selectedSubjects, selectedGroups);
    setIsOnboardingOpen(false);
  };

  const handleSwitchGroup = (
    subject: string,
    activity: string,
    chosenOptionId: string,
  ) => {
    const actKey = activity.toLowerCase().trim();
    const isLabOrProj = ["l", "lab", "p", "proj"].includes(actKey);

    if (isLabOrProj && state) {
      const chosenBlock = state.blocks.find((b) => b.id === chosenOptionId);
      if (chosenBlock) {
        const { group: labNum } = cohortParts(chosenBlock.cohort);
        if (labNum !== null) {
          const targetExNum = exerciseGroupForLab(
            chosenBlock.cohort || config.cohort,
            labNum,
          );
          // Find matching exercise block for this subject
          const exBlock = state.blocks.find((b) => {
            if ((b.subject || "").trim() !== subject.trim()) return false;
            const bAct = (b.activity || "").toLowerCase().trim();
            if (!["c", "cw", "cwiczenia", "ćw"].includes(bAct)) return false;
            const { group: bGr } = cohortParts(b.cohort);
            return bGr === targetExNum;
          });

          if (exBlock) {
            updateSelections(
              { ...config.selectedSubjects, [subject]: true },
              {
                ...config.selectedGroups,
                [`${subject}:${activity}`]: chosenOptionId,
                [`${subject}:${exBlock.activity?.toLowerCase().trim() || "c"}`]:
                  exBlock.id,
              },
            );
            return;
          }
        }
      }
    }

    setSubjectGroup(subject, activity, chosenOptionId);
  };

  const handleSaveOverride = (blockId: string, override: BlockOverride) => {
    setBlockOverride(blockId, override);
  };

  // Show onboarding if not configured and not loading
  const showInitialOnboarding = !isConfigured && !isLoading && Boolean(state);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors">
      <Header
        currentView={currentView}
        onViewChange={setCurrentView}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onRefresh={refresh}
        isLoading={isLoading}
        lastUpdated={lastUpdated}
        cohort={config.cohort}
        theme={theme}
        resolvedTheme={resolvedTheme}
        onToggleTheme={toggleTheme}
      />

      <main className="flex-1 mx-auto w-full max-w-[92%] 2xl:max-w-[1750px] p-4 sm:p-6 lg:p-6">
        {androidDownloadUrl && (
          <div className="mb-4 flex justify-end">
            <a
              href={androidDownloadUrl}
              className="inline-flex items-center gap-2 rounded-sm px-2 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 sm:text-sm"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Pobierz aplikację na Androida
            </a>
          </div>
        )}
        {/* Error notification banner */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 p-4 text-xs sm:text-sm text-red-800 dark:text-red-300 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
              <span>{error}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refresh()}
              className="text-red-700 dark:text-red-300 border-red-300 dark:border-red-800"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Spróbuj ponownie</span>
            </Button>
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
              Wybierz swój kierunek, semestr i grupy, aby wyświetlić
              przejrzysty, spersonalizowany plan zajęć.
            </p>
            <Button size="lg" onClick={() => setIsOnboardingOpen(true)}>
              <span>Wybierz swój rocznik</span>
            </Button>
          </div>
        ) : currentView === "schedule" ? (
          /* Schedule Timetable */
          <ScheduleView
            blocks={userBlocks}
            planType={config.planType}
            onSelectBlock={setSelectedBlock}
            onOpenCustomize={() => setIsOnboardingOpen(true)}
            onOpenAddCustom={() => setIsAddCustomOpen(true)}
          />
        ) : (
          /* Search view */
          <SearchView state={state} onSelectBlock={setSelectedBlock} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200/80 dark:border-zinc-800/80 bg-white/50 dark:bg-zinc-950/50 py-4 text-center text-xs text-zinc-400 dark:text-zinc-500">
        <p>PK Planner · SideArker</p>
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

      {/* Add Custom Block Modal */}
      <AddCustomBlockModal
        isOpen={isAddCustomOpen}
        onClose={() => setIsAddCustomOpen(false)}
        onAddBlock={addCustomBlock}
        planType={config.planType}
      />

      {/* Block Details Modal */}
      <BlockDetailModal
        block={selectedBlock}
        state={state}
        isOpen={Boolean(selectedBlock)}
        onClose={() => setSelectedBlock(null)}
        onSwitchGroup={handleSwitchGroup}
        onSaveOverride={handleSaveOverride}
        onRemoveCustomBlock={removeCustomBlock}
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
        customBlocksCount={config.customBlocks?.length || 0}
        onOpenAddCustom={() => setIsAddCustomOpen(true)}
      />
    </div>
  );
}
