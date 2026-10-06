import type { BlockOverride, PlanType, ScheduleBlock, UserScheduleConfig } from './types'

export const DEFAULT_USER_CONFIG: UserScheduleConfig = {
  cohort: '',
  planType: 'stacjonarne',
  selectedSubjects: {},
  selectedGroups: {},
  overrides: {},
  customBlocks: [],
}

export function isUserConfigured(config: UserScheduleConfig): boolean {
  return Boolean(
    (config.cohort && config.cohort.trim().length > 0) ||
    (config.customBlocks && config.customBlocks.length > 0)
  )
}

export function setConfigCohort(
  prev: UserScheduleConfig,
  cohort: string,
  planType: PlanType = 'stacjonarne',
): UserScheduleConfig {
  return {
    ...prev,
    cohort,
    planType,
    selectedSubjects: {},
    selectedGroups: {},
    customBlocks: prev.customBlocks || [],
  }
}

export function setConfigSelections(
  prev: UserScheduleConfig,
  selectedSubjects: Record<string, boolean>,
  selectedGroups: Record<string, string>,
): UserScheduleConfig {
  return {
    ...prev,
    selectedSubjects,
    selectedGroups,
  }
}

export function setConfigSubjectGroup(
  prev: UserScheduleConfig,
  subject: string,
  activity: string,
  chosenGroupOrId: string,
): UserScheduleConfig {
  const key = `${subject}:${activity.toLowerCase()}`
  return {
    ...prev,
    selectedGroups: {
      ...prev.selectedGroups,
      [key]: chosenGroupOrId,
    },
  }
}

export function setConfigBlockOverride(
  prev: UserScheduleConfig,
  blockId: string,
  override: BlockOverride,
): UserScheduleConfig {
  return {
    ...prev,
    overrides: {
      ...(prev.overrides || {}),
      [blockId]: override,
    },
  }
}

export function createNewCustomBlock(
  blockData: Partial<ScheduleBlock> & { subject: string; planType: PlanType },
): ScheduleBlock {
  const id = blockData.id || `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  return {
    ...blockData,
    id,
    subject: blockData.subject,
    planType: blockData.planType,
    isCustom: true,
  }
}

export function addConfigCustomBlock(
  prev: UserScheduleConfig,
  newBlock: ScheduleBlock,
): UserScheduleConfig {
  return {
    ...prev,
    customBlocks: [...(prev.customBlocks || []), newBlock],
  }
}

export function updateConfigCustomBlock(
  prev: UserScheduleConfig,
  blockId: string,
  updated: Partial<ScheduleBlock>,
): UserScheduleConfig {
  return {
    ...prev,
    customBlocks: (prev.customBlocks || []).map(b => (b.id === blockId ? { ...b, ...updated } : b)),
  }
}

export function removeConfigCustomBlock(
  prev: UserScheduleConfig,
  blockId: string,
): UserScheduleConfig {
  const nextOverrides = { ...(prev.overrides || {}) }
  delete nextOverrides[blockId]
  return {
    ...prev,
    overrides: nextOverrides,
    customBlocks: (prev.customBlocks || []).filter(b => b.id !== blockId),
  }
}
