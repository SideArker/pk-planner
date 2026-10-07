import { Calendar, Moon, RefreshCw, Search, Settings, Sun } from "lucide-react";
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
  resolvedTheme?: "light" | "dark";
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
  resolvedTheme,
  onToggleTheme,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95 transition-colors">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <img
            src="/icon-192.png"
            alt="PK Planner"
            className="h-9 w-9 rounded-md object-cover"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight text-base sm:text-lg">
                PK Planner
              </span>
              {cohort && (
                <span className="hidden sm:inline-flex items-center rounded-sm bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
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
        <nav className="flex items-center rounded-md bg-zinc-100 p-0.5 text-xs font-medium dark:bg-zinc-900 sm:text-sm">
          <button
            onClick={() => onViewChange("schedule")}
            aria-label="Mój plan"
            title="Mój plan"
            className={`flex items-center gap-1.5 rounded-sm px-3 py-1.5 transition-colors ${
              currentView === "schedule"
                ? "bg-white text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Mój plan</span>
          </button>
          <button
            onClick={() => onViewChange("search")}
            aria-label="Wyszukiwarka"
            title="Wyszukiwarka"
            className={`flex items-center gap-1.5 rounded-sm px-3 py-1.5 transition-colors ${
              currentView === "search"
                ? "bg-white text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Wyszukiwarka</span>
          </button>
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            title="Odśwież plan zajęć"
            aria-label="Odśwież plan zajęć"
            className="rounded-sm p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </button>

          {(() => {
            const isDark = (resolvedTheme ?? (theme === "dark" ? "dark" : "light")) === "dark";
            return (
              <button
                type="button"
                onClick={onToggleTheme}
                title={isDark ? "Włącz jasny motyw" : "Włącz ciemny motyw"}
                aria-label={isDark ? "Włącz jasny motyw" : "Włącz ciemny motyw"}
                className="rounded-sm p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              >
                {isDark ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </button>
            );
          })()}

          <button
            type="button"
            onClick={onOpenSettings}
            title="Ustawienia"
            aria-label="Ustawienia"
            className="rounded-sm p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
