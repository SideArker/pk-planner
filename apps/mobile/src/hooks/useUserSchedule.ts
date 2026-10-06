import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  addConfigCustomBlock,
  createNewCustomBlock,
  DEFAULT_USER_CONFIG,
  isUserConfigured,
  removeConfigCustomBlock,
  setConfigBlockOverride,
  setConfigCohort,
  setConfigSelections,
  setConfigSubjectGroup,
  updateConfigCustomBlock,
  type BlockOverride,
  type PlanType,
  type ScheduleBlock,
  type UserScheduleConfig,
} from '@pk-planner/core';

const USER_CONFIG_KEY = 'pk_planner_user_config';

export function useUserSchedule() {
  const [config, setConfigState] = useState<UserScheduleConfig>(DEFAULT_USER_CONFIG);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(USER_CONFIG_KEY);
        if (saved) {
          setConfigState(JSON.parse(saved));
        }
      } catch {
        // ignore load error
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  const saveConfig = useCallback(
    (updater: UserScheduleConfig | ((prev: UserScheduleConfig) => UserScheduleConfig)) => {
      setConfigState((prev) => {
        const updated = typeof updater === 'function' ? updater(prev) : updater;
        AsyncStorage.setItem(USER_CONFIG_KEY, JSON.stringify(updated)).catch(() => {});
        return updated;
      });
    },
    [],
  );

  const saveAllConfig = useCallback(
    (
      cohort: string,
      planType: PlanType,
      selectedSubjects: Record<string, boolean>,
      selectedGroups: Record<string, string>,
    ) => {
      saveConfig((prev) => ({
        ...prev,
        cohort,
        planType,
        selectedSubjects,
        selectedGroups,
      }));
    },
    [saveConfig],
  );

  const setCohort = useCallback(
    (cohort: string, planType: PlanType = 'stacjonarne') => {
      saveConfig((prev) => setConfigCohort(prev, cohort, planType));
    },
    [saveConfig],
  );

  const updateSelections = useCallback(
    (selectedSubjects: Record<string, boolean>, selectedGroups: Record<string, string>) => {
      saveConfig((prev) => setConfigSelections(prev, selectedSubjects, selectedGroups));
    },
    [saveConfig],
  );

  const setSubjectGroup = useCallback(
    (subject: string, activity: string, chosenGroupOrId: string) => {
      saveConfig((prev) => setConfigSubjectGroup(prev, subject, activity, chosenGroupOrId));
    },
    [saveConfig],
  );

  const setBlockOverride = useCallback(
    (blockId: string, override: BlockOverride) => {
      saveConfig((prev) => setConfigBlockOverride(prev, blockId, override));
    },
    [saveConfig],
  );

  const addCustomBlock = useCallback(
    (blockData: Partial<ScheduleBlock> & { subject: string; planType: PlanType }) => {
      const newBlock = createNewCustomBlock(blockData);
      saveConfig((prev) => addConfigCustomBlock(prev, newBlock));
      return newBlock;
    },
    [saveConfig],
  );

  const updateCustomBlock = useCallback(
    (blockId: string, updated: Partial<ScheduleBlock>) => {
      saveConfig((prev) => updateConfigCustomBlock(prev, blockId, updated));
    },
    [saveConfig],
  );

  const removeCustomBlock = useCallback(
    (blockId: string) => {
      saveConfig((prev) => removeConfigCustomBlock(prev, blockId));
    },
    [saveConfig],
  );

  const resetConfig = useCallback(() => {
    saveConfig(DEFAULT_USER_CONFIG);
  }, [saveConfig]);

  const isConfigured = isUserConfigured(config);

  return {
    config,
    isLoaded,
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
  };
}
