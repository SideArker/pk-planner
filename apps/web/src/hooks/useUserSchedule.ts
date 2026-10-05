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

  const saveConfig = useCallback((updated: UserScheduleConfig) => {
    setConfigState(updated)
    localStorage.setItem(USER_CONFIG_KEY, JSON.stringify(updated))
  }, [])

  const setCohort = useCallback((cohort: string, planType: PlanType = 'stacjonarne') => {
    saveConfig({
      cohort,
      planType,
      selectedSubjects: {},
      selectedGroups: {},
      overrides: {},
    })
  }, [saveConfig])

  const updateSelections = useCallback((
    selectedSubjects: Record<string, boolean>,
    selectedGroups: Record<string, string>,
  ) => {
    saveConfig({
      ...config,
      selectedSubjects,
      selectedGroups,
    })
  }, [config, saveConfig])

  const setSubjectGroup = useCallback((subject: string, activity: string, chosenGroupOrId: string) => {
    const key = `${subject}:${activity.toLowerCase()}`
    saveConfig({
      ...config,
      selectedGroups: {
        ...config.selectedGroups,
        [key]: chosenGroupOrId,
      },
    })
  }, [config, saveConfig])

  const setBlockOverride = useCallback((blockId: string, override: BlockOverride) => {
    saveConfig({
      ...config,
      overrides: {
        ...(config.overrides || {}),
        [blockId]: override,
      },
    })
  }, [config, saveConfig])

  const resetConfig = useCallback(() => {
    saveConfig(defaultConfig)
  }, [saveConfig])

  const isConfigured = Boolean(config.cohort && config.cohort.trim().length > 0)

  return {
    config,
    isConfigured,
    setCohort,
    updateSelections,
    setSubjectGroup,
    setBlockOverride,
    resetConfig,
    saveConfig,
  }
}
