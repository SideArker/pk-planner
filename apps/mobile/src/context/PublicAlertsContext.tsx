import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'pk_planner_show_public_alerts';

interface PublicAlertsContextValue {
  showPublicAlerts: boolean;
  isLoaded: boolean;
  setShowPublicAlerts: (value: boolean) => void;
}

const PublicAlertsContext = createContext<PublicAlertsContextValue>({
  showPublicAlerts: true,
  isLoaded: false,
  setShowPublicAlerts: () => {},
});

export function PublicAlertsProvider({ children }: { children: React.ReactNode }) {
  const [showPublicAlerts, setVisible] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then(value => {
        if (active) setVisible(value !== 'false');
      })
      .catch(() => {})
      .finally(() => {
        if (active) setIsLoaded(true);
      });
    return () => { active = false; };
  }, []);

  const setShowPublicAlerts = (value: boolean) => {
    setVisible(value);
    AsyncStorage.setItem(STORAGE_KEY, String(value)).catch(() => {});
  };

  return (
    <PublicAlertsContext.Provider value={{ showPublicAlerts, isLoaded, setShowPublicAlerts }}>
      {children}
    </PublicAlertsContext.Provider>
  );
}

export function usePublicAlerts() {
  return useContext(PublicAlertsContext);
}
