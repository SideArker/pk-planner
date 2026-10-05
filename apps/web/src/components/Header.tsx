import { Calendar, Moon, RefreshCw, Search, Settings, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Theme } from "../hooks/useTheme";

interface HeaderProps {
  currentView: "schedule" | "search";
  onViewChange: (view: "schedule" | "search") => void;
  onOpenSettings: () => void;
  onRefresh: () => void;
  isLoading: boolean;
  lastUpdated: string | null;
  cohort: string;
  theme: Theme;
  onToggleTheme: () => void;
}

export function Header({
  currentView,
  onViewChange,
  onOpenSettings,
  onRefresh,
  isLoading,
  cohort,
  theme,
  onToggleTheme,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95 transition-colors">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight text-base sm:text-lg">
                PK Planner
              </span>
              {cohort && (
                <span className="hidden sm:inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60">
                  {cohort}
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 sm:block hidden">
              Plan zajęć
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <nav className="flex items-center rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs sm:text-sm font-medium">
          <button
            onClick={() => onViewChange("schedule")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-all ${
              currentView === "schedule"
                ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-zinc-50"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>Mój plan</span>
          </button>
          <button
            onClick={() => onViewChange("search")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-all ${
              currentView === "search"
                ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-zinc-50"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            <Search className="h-4 w-4" />
            <span>Wyszukiwarka</span>
          </button>
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            disabled={isLoading}
            title="Odśwież plan zajęć"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={onToggleTheme}
            title={
              theme === "dark" ? "Włącz jasny motyw" : "Włącz ciemny motyw"
            }
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          <Button
            variant="outline"
            onClick={onOpenSettings}
            title="Ustawienia"
            className="flex items-center gap-1.5 px-3"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Ustawienia</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
