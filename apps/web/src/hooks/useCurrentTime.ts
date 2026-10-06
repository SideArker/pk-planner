import { useEffect, useState } from 'react'

/**
 * Returns a live Date object that refreshes periodically.
 * Default interval is 15 seconds to ensure responsive live indicators.
 */
export function useCurrentTime(refreshIntervalMs = 15000): Date {
  const [now, setNow] = useState<Date>(() => new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date())
    }, refreshIntervalMs)

    return () => clearInterval(timer)
  }, [refreshIntervalMs])

  return now
}
