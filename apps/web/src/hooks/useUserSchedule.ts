import { useCallback, useState } from 'react'
import type { BlockOverride, PlanType, UserScheduleConfig } from '@pk-planner/core'

const USER_CONFIG_KEY = 'pk_planner_user_config'

const defaultConfig: UserScheduleConfig = {
  cohort: '',
  planType: 'stacjonarne',
  selectedSubjects: {},
  selectedGroups: {},
  overrides: {},
}

export function useUserSchedule() {
  const [config, setConfigState] = useState<UserScheduleConfig>(() => {
    try {
      const saved = localStorage.getItem(USER_CONFIG_KEY)
      if (saved) {
        return JSON.parse(saved)
      }
    } catch {
      // ignore
    }
    return defaultConfig
  })

  const saveConfig = useCallback((updater: UserScheduleConfig | ((prev: UserScheduleConfig) => UserScheduleConfig)) => {
    setConfigState(prev => {
      const updated = typeof updater === 'function' ? updater(prev) : updater
      try {
        localStorage.setItem(USER_CONFIG_KEY, JSON.stringify(updated))
      } catch {
        // ignore
      }
      return updated
    })
  }, [])

  const saveAllConfig = useCallback((
    cohort: string,
    planType: PlanType,
    selectedSubjects: Record<string, boolean>,
    selectedGroups: Record<string, string>,
  ) => {
    saveConfig(prev => ({
      cohort,
      planType,
      selectedSubjects,
      selectedGroups,
      overrides: prev.overrides || {},
    }))
  }, [saveConfig])

  const setCohort = useCallback((cohort: string, planType: PlanType = 'stacjonarne') => {
    saveConfig(prev => ({
      ...prev,
      cohort,
      planType,
      selectedSubjects: {},
      selectedGroups: {},
    }))
  }, [saveConfig])

  const updateSelections = useCallback((
    selectedSubjects: Record<string, boolean>,
    selectedGroups: Record<string, string>,
  ) => {
    saveConfig(prev => ({
      ...prev,
      selectedSubjects,
      selectedGroups,
    }))
  }, [saveConfig])

  const setSubjectGroup = useCallback((subject: string, activity: string, chosenGroupOrId: string) => {
    const key = `${subject}:${activity.toLowerCase()}`
    saveConfig(prev => ({
      ...prev,
      selectedGroups: {
        ...prev.selectedGroups,
        [key]: chosenGroupOrId,
      },
    }))
  }, [saveConfig])

  const setBlockOverride = useCallback((blockId: string, override: BlockOverride) => {
    saveConfig(prev => ({
      ...prev,
      overrides: {
        ...(prev.overrides || {}),
        [blockId]: override,
      },
    }))
  }, [saveConfig])

  const resetConfig = useCallback(() => {
    saveConfig(defaultConfig)
  }, [saveConfig])

  const isConfigured = Boolean(config.cohort && config.cohort.trim().length > 0)

  return {
    config,
    isConfigured,
    saveAllConfig,
    setCohort,
    updateSelections,
    setSubjectGroup,
    setBlockOverride,
    resetConfig,
    saveConfig,
  }
}

