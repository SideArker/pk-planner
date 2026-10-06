import { useState } from 'react'
import {
  STANDARD_PK_SLOTS,
  type Day,
  type PlanType,
  type ScheduleBlock,
  availableDays,
  DAY_INFO,
  minutesToTime,
  timeToMinutes,
} from '@pk-planner/core'
import { BookOpen, Calendar, Clock, MapPin, Plus, User, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface AddCustomBlockModalProps {
  isOpen: boolean
  onClose: () => void
  onAddBlock: (block: Partial<ScheduleBlock> & { subject: string; planType: PlanType }) => void
  planType: PlanType
  defaultDay?: Day
}

const ACTIVITY_OPTIONS = [
  { value: 'W', label: 'Wykład', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
  { value: 'Ć', label: 'Ćwiczenia', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
  { value: 'L', label: 'Laboratorium', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
  { value: 'P', label: 'Projekt', color: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' },
  { value: 'S', label: 'Seminarium', color: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' },
  { value: 'Lektorat', label: 'Lektorat', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300' },
  { value: 'WF', label: 'WF', color: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300' },
  { value: 'Inne', label: 'Inne', color: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300' },
]

export function AddCustomBlockModal({
  isOpen,
  onClose,
  onAddBlock,
  planType,
  defaultDay = 'MON',
}: AddCustomBlockModalProps) {
  const days: Day[] = availableDays(planType)

  const [subject, setSubject] = useState('')
  const [activity, setActivity] = useState('Ć')
  const [day, setDay] = useState<Day>(days.includes(defaultDay) ? defaultDay : (days[0] || 'MON'))
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(2) // default blok 2
  const [customStartTime, setCustomStartTime] = useState('09:15')
  const [duration, setDuration] = useState(90)
  const [parity, setParity] = useState<'all' | 'A' | 'B'>('all')
  const [room, setRoom] = useState('')
  const [teacher, setTeacher] = useState('')
  const [cohort, setCohort] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSelectSlot = (slot: typeof STANDARD_PK_SLOTS[number]) => {
    setSelectedSlotIndex(slot.index)
    setCustomStartTime(minutesToTime(slot.start))
    setDuration(slot.duration)
  }

  const handleCustomTimeChange = (val: string) => {
    setCustomStartTime(val)
    setSelectedSlotIndex(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim()) {
      setError('Podaj nazwę zajęć lub przedmiotu.')
      return
    }

    const startMinutes = timeToMinutes(customStartTime)
    if (startMinutes == null) {
      setError('Podaj poprawną godzinę rozpoczęcia (np. 09:15).')
      return
    }

    const teachingWeekParity = parity === 'A' ? 0 : parity === 'B' ? 1 : null

    onAddBlock({
      subject: subject.trim(),
      activity: activity.trim(),
      day,
      start: startMinutes,
      duration: Number(duration) || 90,
      planType,
      teachingWeekParity,
      room: room.trim() || null,
      teacher: teacher.trim() || undefined,
      teacherDisplay: teacher.trim() || undefined,
      cohort: cohort.trim() || 'Własne',
      notes: notes.trim() || undefined,
      isCustom: true,
    })

    // Reset and close
    setSubject('')
    setNotes('')
    setRoom('')
    setTeacher('')
    setCohort('')
    setError(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4">
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="shrink-0 border-b border-zinc-100 dark:border-zinc-800/80 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs">
              <Plus className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
                Dodaj własne zajęcia
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Wprowadź lektorat, WF, koło naukowe lub własne aktywności
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-lg cursor-pointer transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 p-6 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Subject Name */}
          <div>
            <label className="block font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
              Nazwa przedmiotu / zajęć <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              required
              value={subject}
              onChange={e => {
                setSubject(e.target.value)
                if (error) setError(null)
              }}
              placeholder="np. Język angielski (C1), WF - Basen, Koło naukowe..."
              className="text-xs"
              autoFocus
            />
          </div>

          {/* Activity / Type */}
          <div>
            <label className="block font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5 flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-zinc-500" />
              <span>Typ zajęć</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {ACTIVITY_OPTIONS.map(opt => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setActivity(opt.value)}
                  className={`py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer font-medium ${
                    activity === opt.value
                      ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                      : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Day of Week */}
          <div>
            <label className="block font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-zinc-500" />
              <span>Dzień tygodnia</span>
            </label>
            <div className="flex gap-1.5 flex-wrap">
              {days.map(d => (
                <button
                  type="button"
                  key={d}
                  onClick={() => setDay(d)}
                  className={`flex-1 min-w-[50px] py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer font-medium ${
                    day === d
                      ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                      : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  {DAY_INFO[d][0]}
                </button>
              ))}
            </div>
          </div>

          {/* Time & Duration */}
          <div>
            <label className="block font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-zinc-500" />
              <span>Godzina i czas trwania</span>
            </label>

            {/* Quick slots */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-2.5">
              {STANDARD_PK_SLOTS.map(slot => (
                <button
                  type="button"
                  key={slot.index}
                  onClick={() => handleSelectSlot(slot)}
                  className={`py-1.5 px-1.5 rounded-lg border text-center transition-all cursor-pointer font-mono text-[11px] ${
                    selectedSlotIndex === slot.index
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold'
                      : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  {minutesToTime(slot.start)} ({slot.index})
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">
                  Godzina rozpoczęcia
                </label>
                <Input
                  type="time"
                  value={customStartTime}
                  onChange={e => handleCustomTimeChange(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">
                  Czas trwania (minuty)
                </label>
                <Input
                  type="number"
                  min={15}
                  max={360}
                  step={15}
                  value={duration}
                  onChange={e => {
                    setDuration(Number(e.target.value))
                    setSelectedSlotIndex(null)
                  }}
                  className="font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* Parity */}
          <div>
            <label className="block font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">
              Częstotliwość tygodni
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setParity('all')}
                className={`py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer font-medium ${
                  parity === 'all'
                    ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300'
                }`}
              >
                Co tydzień
              </button>
              <button
                type="button"
                onClick={() => setParity('A')}
                className={`py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer font-medium ${
                  parity === 'A'
                    ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300'
                }`}
              >
                Tydzień A
              </button>
              <button
                type="button"
                onClick={() => setParity('B')}
                className={`py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer font-medium ${
                  parity === 'B'
                    ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300'
                }`}
              >
                Tydzień B
              </button>
            </div>
          </div>

          {/* Room & Teacher */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-zinc-800 dark:text-zinc-200 mb-1 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-zinc-500" />
                <span>Sala / Lokalizacja (opcjonalnie)</span>
              </label>
              <Input
                type="text"
                value={room}
                onChange={e => setRoom(e.target.value)}
                placeholder="np. F-212, Online, Basen..."
                className="text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-800 dark:text-zinc-200 mb-1 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-zinc-500" />
                <span>Prowadzący (opcjonalnie)</span>
              </label>
              <Input
                type="text"
                value={teacher}
                onChange={e => setTeacher(e.target.value)}
                placeholder="np. dr inż. Jan Kowalski"
                className="text-xs"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
              Notatki (opcjonalnie)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="np. Link do platformy, wymagane materiały..."
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent p-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-1 focus:ring-zinc-800"
            />
          </div>

          {/* Submit buttons */}
          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-2.5">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Anuluj
            </Button>
            <Button type="submit" size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              <span>Dodaj zajęcia</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
