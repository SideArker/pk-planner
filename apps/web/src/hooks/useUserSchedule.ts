import { useCallback, useState } from 'react'
import type { BlockOverride, PlanType, ScheduleBlock, UserScheduleConfig } from '@pk-planner/core'

const USER_CONFIG_KEY = 'pk_planner_user_config'

const defaultConfig: UserScheduleConfig = {
  cohort: '',
  planType: 'stacjonarne',
  selectedSubjects: {},
  selectedGroups: {},
  overrides: {},
  customBlocks: [],
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
      customBlocks: prev.customBlocks || [],
    }))
  }, [saveConfig])

  const setCohort = useCallback((cohort: string, planType: PlanType = 'stacjonarne') => {
    saveConfig(prev => ({
      ...prev,
      cohort,
      planType,
      selectedSubjects: {},
      selectedGroups: {},
      customBlocks: prev.customBlocks || [],
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

  const addCustomBlock = useCallback((blockData: Partial<ScheduleBlock> & { subject: string; planType: PlanType }) => {
    const id = blockData.id || `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const newBlock: ScheduleBlock = {
      ...blockData,
      id,
      subject: blockData.subject,
      planType: blockData.planType,
      isCustom: true,
    }
    saveConfig(prev => ({
      ...prev,
      customBlocks: [...(prev.customBlocks || []), newBlock],
    }))
    return newBlock
  }, [saveConfig])

  const updateCustomBlock = useCallback((blockId: string, updated: Partial<ScheduleBlock>) => {
    saveConfig(prev => ({
      ...prev,
      customBlocks: (prev.customBlocks || []).map(b => (b.id === blockId ? { ...b, ...updated } : b)),
    }))
  }, [saveConfig])

  const removeCustomBlock = useCallback((blockId: string) => {
    saveConfig(prev => {
      const nextOverrides = { ...(prev.overrides || {}) }
      delete nextOverrides[blockId]
      return {
        ...prev,
        overrides: nextOverrides,
        customBlocks: (prev.customBlocks || []).filter(b => b.id !== blockId),
      }
    })
  }, [saveConfig])

  const resetConfig = useCallback(() => {
    saveConfig(defaultConfig)
  }, [saveConfig])

  const isConfigured = Boolean(
    (config.cohort && config.cohort.trim().length > 0) ||
    (config.customBlocks && config.customBlocks.length > 0)
  )

  return {
    config,
    isConfigured,
    saveAllConfig,
    setCohort,
    updateSelections,
    setSubjectGroup,
    setBlockOverride,
    addCustomBlock,
    updateCustomBlock,
    removeCustomBlock,
    resetConfig,
    saveConfig,
  }
}


