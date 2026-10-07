import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { parseSchedulePayload, type SchedulePayload } from '@pk-planner/core';

const CACHE_KEY = 'pk_planner_cached_payload';
const CACHE_TIME_KEY = 'pk_planner_cached_time';
const DEFAULT_API_URL = 'https://pkplanner.sidearker.com/api/schedule';

export function useScheduleData() {
  const [payload, setPayload] = useState<SchedulePayload | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const lastFetchTimeRef = useRef<number>(0);
  const isFetchingRef = useRef<boolean>(false);

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
    const now = Date.now();
    if (!force) {
      if (isFetchingRef.current) return;
      if (now - lastFetchTimeRef.current < 6000) return;
    }
    lastFetchTimeRef.current = now;
    isFetchingRef.current = true;
    setIsLoading(true);
    setError(null);

    const apiUrl = process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL;

    try {
      const res = await fetch(apiUrl, {
        headers: force ? { 'Cache-Control': 'no-cache' } : {},
      });
      if (!res.ok) {
        throw new Error(`Worker HTTP ${res.status}`);
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
      isFetchingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSchedule();

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void fetchSchedule();
      }
    });

    return () => {
      subscription.remove();
    };
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
