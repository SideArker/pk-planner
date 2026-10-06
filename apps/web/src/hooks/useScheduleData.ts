import { useCallback, useEffect, useState } from 'react'
import { parseSchedulePayload, type SchedulePayload } from '@pk-planner/core'

const CACHE_KEY = 'pk_planner_cached_payload'
const CACHE_TIME_KEY = 'pk_planner_cached_time'
const FALLBACK_URL = 'https://example.com/api/schedule-snapshot.php'

export function useScheduleData() {
  const [payload, setPayload] = useState<SchedulePayload | null>(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        return parseSchedulePayload(JSON.parse(cached))
      }
    } catch {
      // ignore cache parse error
    }
    return null
  })

  const [isLoading, setIsLoading] = useState<boolean>(!payload)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(() => {
    return localStorage.getItem(CACHE_TIME_KEY)
  })

  const fetchSchedule = useCallback(async (force = false) => {
    setIsLoading(true)
    setError(null)

    const apiUrl = import.meta.env.VITE_API_URL || '/api/schedule'

    try {
      let res: Response
      try {
        res = await fetch(apiUrl, { cache: force ? 'reload' : 'default' })
        if (!res.ok) throw new Error(`Worker HTTP ${res.status}`)
      } catch (workerErr) {
        // Fallback directly to public university snapshot if worker not running
        res = await fetch(FALLBACK_URL)
        if (!res.ok) throw workerErr
      }

      const json = await res.json()
      const parsed = parseSchedulePayload(json)

      setPayload(parsed)
      const nowStr = new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
      setLastUpdated(nowStr)

      localStorage.setItem(CACHE_KEY, JSON.stringify(json))
      localStorage.setItem(CACHE_TIME_KEY, nowStr)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nie udało się pobrać planu zajęć'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSchedule()
  }, [fetchSchedule])

  return {
    payload,
    state: payload?.state ?? null,
    isLoading,
    error,
    lastUpdated,
    refresh: () => fetchSchedule(true),
  }
}
