import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { parseSchedulePayload, type SchedulePayload } from '@pk-planner/core';

const CACHE_KEY = 'pk_planner_cached_payload';
const CACHE_TIME_KEY = 'pk_planner_cached_time';
const DEFAULT_API_URL = 'https://pk-planner.rsowa126.workers.dev/api/schedule';
const FALLBACK_URL = 'https://example.com/api/schedule-snapshot.php';

export function useScheduleData() {
  const [payload, setPayload] = useState<SchedulePayload | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    // Load from cache first
    (async () => {
      try {
        const [cached, time] = await Promise.all([
          AsyncStorage.getItem(CACHE_KEY),
          AsyncStorage.getItem(CACHE_TIME_KEY),
        ]);
        if (cached) {
          const parsed = parseSchedulePayload(JSON.parse(cached));
          setPayload(parsed);
          setIsLoading(false);
        }
        if (time) {
          setLastUpdated(time);
        }
      } catch {
        // ignore cache read error
      }
    })();
  }, []);

  const fetchSchedule = useCallback(async (force = false) => {
    setIsLoading(true);
    setError(null);

    const apiUrl = process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL;

    try {
      let res: Response;
      try {
        res = await fetch(apiUrl, {
          headers: force ? { 'Cache-Control': 'no-cache' } : {},
        });
        if (!res.ok) {
          throw new Error(`Worker HTTP ${res.status}`);
        }
      } catch (workerErr) {
        // Fallback directly to public university snapshot if worker not reachable
        res = await fetch(FALLBACK_URL);
        if (!res.ok) {
          throw workerErr instanceof Error ? workerErr : new Error('Błąd pobierania planu');
        }
      }

      const json = await res.json();
      const parsed = parseSchedulePayload(json);

      setPayload(parsed);
      const nowStr = new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
      setLastUpdated(nowStr);

      await Promise.all([
        AsyncStorage.setItem(CACHE_KEY, JSON.stringify(json)),
        AsyncStorage.setItem(CACHE_TIME_KEY, nowStr),
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nie udało się pobrać planu zajęć';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  return {
    payload,
    state: payload?.state ?? null,
    isLoading,
    error,
    lastUpdated,
    refresh: () => fetchSchedule(true),
  };
}
