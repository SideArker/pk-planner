import type { PlanType, ScheduleBlock } from '@pk-planner/core'
import { generateIcs } from '@pk-planner/core'
import {
  Calendar,
  Download,
  GraduationCap,
  Layers,
  Moon,
  Plus,
  RotateCcw,
  Sun,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Theme } from '../hooks/useTheme'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  cohort: string
  planType: PlanType
  onChangeCohort: () => void
  onReconfigureGroups: () => void
  theme: Theme
  onSetTheme: (theme: Theme) => void
  onReset: () => void
  userBlocks: ScheduleBlock[]
  customBlocksCount?: number
  onOpenAddCustom?: () => void
}

export function SettingsModal({
  isOpen,
  onClose,
  cohort,
  planType,
  onChangeCohort,
  onReconfigureGroups,
  theme,
  onSetTheme,
  onReset,
  userBlocks,
  customBlocksCount,
  onOpenAddCustom,
}: SettingsModalProps) {
  if (!isOpen) return null

  const handleExportAllIcs = () => {
    const icsContent = generateIcs(userBlocks, { calendarName: `Plan - ${cohort}` })
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Plan_zajec_${cohort.replace(/[^a-z0-9]/gi, '_')}.ics`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4">
      <div className="relative w-full max-w-md max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="shrink-0 border-b border-zinc-100 dark:border-zinc-800/80 px-6 py-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Ustawienia</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-lg cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs sm:text-sm">
          {/* Section: Rocznik / Kierunek */}
          <div className="space-y-2">
            <h3 className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
              <GraduationCap className="h-4 w-4" />
              <span>Twój profil studiów</span>
            </h3>
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-between">
              <div>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">{cohort || 'Brak'}</p>
                <p className="text-[11px] text-zinc-500">{planType}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose()
                  onChangeCohort()
                }}
              >
                Zmień
              </Button>
            </div>
          </div>

          {/* Section: Grupy */}
          <div className="space-y-2">
            <h3 className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
              <Layers className="h-4 w-4" />
              <span>Dostosowanie grup i przedmiotów</span>
            </h3>
            <button
              onClick={() => {
                onClose()
                onReconfigureGroups()
              }}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 bg-zinc-50 dark:bg-zinc-950 text-left hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors flex items-center justify-between cursor-pointer"
            >
              <div>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  Wybierz grupy ćwiczeniowe i laby
                </p>
                <p className="text-[11px] text-zinc-500">
                  Zmień przedmioty na które chodzisz lub numery grup
                </p>
              </div>
              <span className="text-xs text-zinc-400">Edytuj →</span>
            </button>
          </div>

          {/* Section: Własne zajęcia */}
          <div className="space-y-2">
            <h3 className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
              <Plus className="h-4 w-4" />
              <span>Własne zajęcia ({customBlocksCount || 0})</span>
            </h3>
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-between">
              <div>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  {customBlocksCount ? `${customBlocksCount} dodanych zajęć` : 'Brak dodanych zajęć'}
                </p>
                <p className="text-[11px] text-zinc-500">
                  Lektoraty, WF, koła naukowe
                </p>
              </div>
              {onOpenAddCustom && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onClose()
                    onOpenAddCustom()
                  }}
                  className="gap-1 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Dodaj</span>
                </Button>
              )}
            </div>
          </div>

          {/* Section: Eksport całego planu */}
          <div className="space-y-2">
            <h3 className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span>Eksport całego semestru</span>
            </h3>
            <Button
              onClick={handleExportAllIcs}
              className="w-full"
            >
              <Download className="h-4 w-4" />
              <span>Pobierz plik .ics (Google/Apple/Outlook)</span>
            </Button>
          </div>

          {/* Section: Motyw */}
          <div className="space-y-2">
            <h3 className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
              <Sun className="h-4 w-4" />
              <span>Motyw interfejsu</span>
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => onSetTheme('light')}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 transition-all text-xs ${
                  theme === 'light'
                    ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 font-medium'
                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <Sun className="h-3.5 w-3.5" />
                <span>Jasny</span>
              </button>
              <button
                onClick={() => onSetTheme('dark')}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 transition-all text-xs ${
                  theme === 'dark'
                    ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 font-medium'
                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <Moon className="h-3.5 w-3.5" />
                <span>Ciemny</span>
              </button>
              <button
                onClick={() => onSetTheme('system')}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 transition-all text-xs ${
                  theme === 'system'
                    ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 font-medium'
                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <span>System</span>
              </button>
            </div>
          </div>

          {/* Section: Reset */}
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <button
              onClick={() => {
                if (window.confirm('Czy na pewno chcesz zresetować wszystkie ustawienia i plan?')) {
                  onReset()
                  onClose()
                }
              }}
              className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Zresetuj zapisane dane</span>
            </button>
          </div>
          <a
            href="/prywatnosc.html"
            className="inline-block text-xs text-zinc-600 underline underline-offset-2 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Prywatność w PK Planner
          </a>
        </div>
      </div>
    </div>
  )
}
