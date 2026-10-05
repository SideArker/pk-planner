import { useEffect, useState } from 'react'
import {
  type BlockOverride,
  type ScheduleBlock,
  type ScheduleState,
  findAlternativeGroups,
  generateIcs,
  getGoogleCalendarUrl,
  minutesToTime,
  roomLabel,
  teacherDisplay,
} from '@pk-planner/core'
import {
  Clock,
  Download,
  ExternalLink,
  EyeOff,
  MapPin,
  Save,
  Settings2,
  User,
  Users,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface BlockDetailModalProps {
  block: ScheduleBlock | null
  state: ScheduleState | null
  isOpen: boolean
  onClose: () => void
  onSwitchGroup: (subject: string, activity: string, chosenOptionId: string) => void
  onSaveOverride: (blockId: string, override: BlockOverride) => void
}

export function BlockDetailModal({
  block,
  state,
  isOpen,
  onClose,
  onSwitchGroup,
  onSaveOverride,
}: BlockDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'switchGroup' | 'custom'>('details')
  const [customSubject, setCustomSubject] = useState('')
  const [customTeacher, setCustomTeacher] = useState('')
  const [customRoom, setCustomRoom] = useState('')
  const [customNotes, setCustomNotes] = useState('')

  useEffect(() => {
    if (block) {
      setCustomSubject(block.subject || '')
      setCustomTeacher(teacherDisplay(block) || '')
      setCustomRoom(block.room || '')
      setCustomNotes(block.notes || '')
      setActiveTab('details')
    }
  }, [block])

  if (!isOpen || !block) return null

  const alternativeGroups = state ? findAlternativeGroups(state, block) : []
  const gCalUrl = getGoogleCalendarUrl(block)

  const handleDownloadIcs = () => {
    const icsContent = generateIcs([block], { calendarName: block.subject })
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${block.subject.replace(/[^a-z0-9]/gi, '_')}.ics`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleSaveCustom = () => {
    onSaveOverride(block.id, {
      customSubject: customSubject.trim() || undefined,
      customTeacher: customTeacher.trim() || undefined,
      customRoom: customRoom.trim() || undefined,
      customNotes: customNotes.trim() || undefined,
    })
    onClose()
  }

  const handleHideBlock = () => {
    onSaveOverride(block.id, {
      hidden: true,
    })
    onClose()
  }

  const startTime = minutesToTime(block.start)
  const endTime = minutesToTime((block.start ?? 0) + (block.duration || 90))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="border-b border-zinc-100 dark:border-zinc-800/80 px-6 py-4 flex items-start justify-between">
          <div className="space-y-1 pr-6">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
                {block.activity?.toUpperCase() || 'ZAJĘCIA'}
              </span>
              {typeof block.frequency === 'string' && (
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {block.frequency === 'co_tydzien' ? 'Co tydzień' : String(block.frequency)}
                </span>
              )}
            </div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
              {block.subject}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 px-6 bg-zinc-50 dark:bg-zinc-950/60 text-xs font-medium">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-2.5 px-3 border-b-2 transition-colors ${
              activeTab === 'details'
                ? 'border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            Szczegóły
          </button>
          <button
            onClick={() => setActiveTab('switchGroup')}
            className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 transition-colors ${
              activeTab === 'switchGroup'
                ? 'border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Zmień grupę ({alternativeGroups.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 transition-colors ${
              activeTab === 'custom'
                ? 'border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            <Settings2 className="h-3.5 w-3.5" />
            <span>Własna edycja</span>
          </button>
        </div>

        {/* Tab content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {activeTab === 'details' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 p-3 bg-zinc-50/50 dark:bg-zinc-950/50 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Termin</span>
                  </div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    {block.day} · {startTime} - {endTime}
                  </p>
                  <p className="text-[11px] text-zinc-400">Czas trwania: {block.duration || 90} min</p>
                </div>

                <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 p-3 bg-zinc-50/50 dark:bg-zinc-950/50 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>Lokalizacja</span>
                  </div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    {block.room ? `Sala ${roomLabel(block.room)}` : 'Zdalnie / brak'}
                  </p>
                  <p className="text-[11px] text-zinc-400">Kampus: {block.campus || 'PK'}</p>
                </div>

                <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 p-3 bg-zinc-50/50 dark:bg-zinc-950/50 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <User className="h-3.5 w-3.5" />
                    <span>Prowadzący</span>
                  </div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    {teacherDisplay(block) || 'Nieprzypisany'}
                  </p>
                </div>

                <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 p-3 bg-zinc-50/50 dark:bg-zinc-950/50 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <Users className="h-3.5 w-3.5" />
                    <span>Grupa</span>
                  </div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                    {block.cohort || 'Ogólna'}
                  </p>
                </div>
              </div>

              {block.notes && (
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 bg-amber-50/40 dark:bg-amber-950/20 text-xs">
                  <span className="font-semibold text-amber-900 dark:text-amber-200">Uwagi: </span>
                  <span className="text-amber-800 dark:text-amber-300">{block.notes}</span>
                </div>
              )}

              {/* Calendar export actions */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <Button asChild className="flex-1">
                  <a href={gCalUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    <span>Dodaj do Google Calendar</span>
                  </a>
                </Button>

                <Button variant="outline" onClick={handleDownloadIcs}>
                  <Download className="h-4 w-4" />
                  <span>Pobierz .ics</span>
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'switchGroup' && (
            <div className="space-y-3">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Wybierz inną grupę dla tych zajęć. Blok w planie zostanie natychmiast przeniesiony na
                jej termin.
              </p>

              <div className="space-y-2">
                {alternativeGroups.map(opt => {
                  const isCurrent = opt.id === block.id

                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        onSwitchGroup(block.subject, block.activity || '', opt.id)
                        onClose()
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all text-xs ${
                        isCurrent
                          ? 'border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-800 font-medium'
                          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {opt.group} {isCurrent && '✓ (Obecna)'}
                        </div>
                        <div className="text-zinc-500 dark:text-zinc-400 mt-0.5">
                          {opt.teacher} · {opt.day} {minutesToTime(opt.start)} - {minutesToTime((opt.start ?? 0) + opt.duration)}
                          {opt.room ? ` · s. ${opt.room}` : ''}
                        </div>
                      </div>
                      <span className="text-[11px] text-zinc-400">Przełącz</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {activeTab === 'custom' && (
            <div className="space-y-4 text-xs">
              <p className="text-zinc-500 dark:text-zinc-400">
                Możesz nadpisać nazwę przedmiotu, prowadzącego lub salę tylko dla swojego widoku.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Własna nazwa przedmiotu
                  </label>
                  <input
                    type="text"
                    value={customSubject}
                    onChange={e => setCustomSubject(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-1 focus:ring-zinc-800"
                  />
                </div>

                <div>
                  <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Prowadzący
                  </label>
                  <Input
                    type="text"
                    value={customTeacher}
                    onChange={e => setCustomTeacher(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">Sala</label>
                  <Input
                    type="text"
                    value={customRoom}
                    onChange={e => setCustomRoom(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Własne notatki
                  </label>
                  <textarea
                    rows={2}
                    value={customNotes}
                    onChange={e => setCustomNotes(e.target.value)}
                    placeholder="Np. link do Discorda / materiałów..."
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent p-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-1 focus:ring-zinc-800"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleHideBlock}
                >
                  <EyeOff className="h-3.5 w-3.5" />
                  <span>Ukryj te zajęcia</span>
                </Button>

                <Button
                  size="sm"
                  onClick={handleSaveCustom}
                  className="ml-auto"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Zapisz zmiany</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
