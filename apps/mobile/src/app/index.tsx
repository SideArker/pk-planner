import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  type BlockOverride,
  type Day,
  type PlanType,
  type ScheduleBlock,
  detectScheduleCollisions,
  isBlockInWeekParity,
  resolveUserBlocks,
} from '@pk-planner/core';

import { AddCustomBlockModal } from '@/components/AddCustomBlockModal';
import { BlockCard } from '@/components/BlockCard';
import { BlockDetailModal } from '@/components/BlockDetailModal';
import { DaySelector } from '@/components/DaySelector';
import { Header } from '@/components/Header';
import { OnboardingModal } from '@/components/OnboardingModal';
import { WeekParityFilter, WeekParitySelector } from '@/components/WeekParitySelector';
import { EmptyState } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/context/ThemeContext';
import { useScheduleData } from '@/hooks/useScheduleData';
import { useUserSchedule } from '@/hooks/useUserSchedule';
import { loadNotificationPreferences, syncNotifications } from '@/utils/notifications';

function getInitialToday(days: Day[]): Day {
  const dayIndex = new Date().getDay();
  const map: Record<number, Day> = {
    1: 'MON',
    2: 'TUE',
    3: 'WED',
    4: 'THU',
    5: 'FRI',
    6: 'SAT',
    0: 'SUN',
  };
  const current = map[dayIndex] || 'MON';
  return days.includes(current) ? current : days[0] || 'MON';
}

const WEEK_DAYS: Day[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export default function ScheduleScreen() {
  const { theme, resolvedTheme } = useAppTheme();
  const isDark = resolvedTheme === 'dark';

  const { state, isLoading, error, refresh } = useScheduleData();
  const {
    config,
    isLoaded,
    isConfigured,
    saveAllConfig,
    setSubjectGroup,
    setBlockOverride,
    addCustomBlock,
    removeCustomBlock,
  } = useUserSchedule();

  const days = WEEK_DAYS;

  const [selectedDay, setSelectedDay] = useState<Day>(() => getInitialToday(days));
  const [selectedParity, setSelectedParity] = useState<WeekParityFilter>('ALL');
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useFocusEffect(useCallback(() => {
    setSelectedDay(getInitialToday(days));
  }, [days]));

  const [selectedBlock, setSelectedBlock] = useState<ScheduleBlock | null>(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isAddCustomOpen, setIsAddCustomOpen] = useState(false);

  // Resolve user's blocks from state & config
  const userBlocks = useMemo(() => {
    if (!state) return [];
    return resolveUserBlocks(state, config);
  }, [state, config]);

  useFocusEffect(useCallback(() => {
    if (!isLoaded || !state) return;
    let active = true;
    void loadNotificationPreferences().then((preferences) => {
      if (active) void syncNotifications(userBlocks, preferences).catch(() => {});
    });
    return () => { active = false; };
  }, [isLoaded, state, userBlocks]));

  // Collisions detection
  const collisions = useMemo(() => {
    return detectScheduleCollisions(userBlocks);
  }, [userBlocks]);

  // Counts of classes per day
  const dayCounts = useMemo(() => {
    const counts: Partial<Record<Day, number>> = {};
    for (const b of userBlocks) {
      if (!b.day) continue;
      // Filter by parity if A or B selected
      if (selectedParity !== 'ALL' && !isBlockInWeekParity(b, selectedParity)) {
        continue;
      }
      counts[b.day] = (counts[b.day] || 0) + 1;
    }
    return counts;
  }, [userBlocks, selectedParity]);

  // Filtered blocks for selected day
  const dayBlocks = useMemo(() => {
    const filtered = userBlocks.filter((b) => {
      if (b.day !== selectedDay) return false;
      if (selectedParity !== 'ALL' && !isBlockInWeekParity(b, selectedParity)) {
        return false;
      }
      return true;
    });

    return filtered.sort((a, b) => (a.start ?? 0) - (b.start ?? 0));
  }, [userBlocks, selectedDay, selectedParity]);

  const handleSaveOnboarding = (
    cohort: string,
    planType: PlanType,
    selectedSubjects: Record<string, boolean>,
    selectedGroups: Record<string, string>,
  ) => {
    saveAllConfig(cohort, planType, selectedSubjects, selectedGroups);
    setIsOnboardingOpen(false);
  };

  const handleSaveOverride = (blockId: string, override: BlockOverride) => {
    setBlockOverride(blockId, override);
  };

  const showInitialOnboarding = !isConfigured && !isLoading && Boolean(state);

  return (
    <SafeAreaView
      edges={['top']}
      style={[
        styles.safeArea,
        { backgroundColor: isDark ? '#09090b' : '#f8fafc' },
      ]}>
      {/* Header */}
      <Header
        isLoading={isLoading}
        onRefresh={refresh}
        onAddCustom={() => setIsAddCustomOpen(true)}
      />

      {/* Main Content */}
      {isLoading && !state ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Pobieranie aktualnego planu zajęć...
          </Text>
        </View>
      ) : !isConfigured ? (
        <View style={styles.centerContainer}>
          <View
            style={[
              styles.welcomeIconBox,
              {
                backgroundColor: isDark ? '#18181b' : '#ffffff',
                borderColor: theme.border,
              },
            ]}>
            <Ionicons
              name="calendar"
              size={36}
              color={theme.accent}
            />
          </View>
          <Text style={[styles.welcomeTitle, { color: theme.text }]}>
            Witaj w PK Planer!
          </Text>
          <Text style={[styles.welcomeSubtitle, { color: theme.textSecondary }]}>
            Wybierz swój kierunek, semestr i grupy, aby wyświetlić przejrzysty plan zajęć.
          </Text>
          {Boolean(error) && (
            <View
              style={[
                styles.collisionAlert,
                {
                  backgroundColor: isDark ? '#450a0a' : '#fee2e2',
                  borderColor: theme.destructive,
                  marginBottom: 16,
                  maxWidth: 340,
                },
              ]}>
              <Ionicons
                name="alert-circle-outline"
                size={18}
                color={theme.destructive}
              />
              <Text style={[styles.collisionAlertText, { color: theme.destructive, flex: 1 }]}>
                {error}
              </Text>
            </View>
          )}
          <Pressable
            onPress={() => {
              if (error && !state) {
                refresh();
              } else {
                setIsOnboardingOpen(true);
              }
            }}
            style={({ pressed }) => [
              styles.primaryBtn,
              {
                backgroundColor: isDark ? '#fafafa' : '#18181b',
                opacity: pressed ? 0.8 : 1,
              },
            ]}>
            <Text
              style={[
                styles.primaryBtnText,
                { color: isDark ? '#09090b' : '#ffffff' },
              ]}>
              {error && !state ? 'Spróbuj pobrać ponownie' : 'Wybierz swój rocznik'}
            </Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.flexOne}>
          {/* Error Banner */}
          {Boolean(error) && (
            <View
              style={[
                styles.collisionAlert,
                {
                  backgroundColor: isDark ? '#450a0a' : '#fee2e2',
                  borderColor: theme.destructive,
                },
              ]}>
              <Ionicons
                name="alert-circle-outline"
                size={18}
                color={theme.destructive}
              />
              <Text style={[styles.collisionAlertText, { color: theme.destructive, flex: 1 }]}>
                {error}
              </Text>
            </View>
          )}

          {/* Collisions Alert Banner if collisions exist */}
          {collisions.size > 0 && (
            <View
              style={[
                styles.collisionAlert,
                {
                  backgroundColor: isDark ? '#450a0a' : '#fee2e2',
                  borderColor: theme.destructive,
                },
              ]}>
              <Ionicons
                name="warning-outline"
                size={18}
                color={theme.destructive}
              />
              <Text style={[styles.collisionAlertText, { color: theme.destructive }]}>
                Wykryto kolizje w planie ({collisions.size})
              </Text>
            </View>
          )}

          {/* Week Parity Selector */}
          <WeekParitySelector
            selectedParity={selectedParity}
            onSelectParity={setSelectedParity}
          />

          {/* Day Selector */}
          <DaySelector
            days={days}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
            dayCounts={dayCounts}
          />

          {/* Schedule List */}
          <FlatList
            data={dayBlocks}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            alwaysBounceVertical
            onTouchStart={(event) => {
              touchStart.current = {
                x: event.nativeEvent.pageX,
                y: event.nativeEvent.pageY,
              };
            }}
            onTouchEnd={(event) => {
              const start = touchStart.current;
              touchStart.current = null;
              if (!start) return;
              const dx = event.nativeEvent.pageX - start.x;
              const dy = event.nativeEvent.pageY - start.y;
              if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.3) {
                const nextIndex = days.indexOf(selectedDay) + (dx < 0 ? 1 : -1);
                if (nextIndex >= 0 && nextIndex < days.length) {
                  setSelectedDay(days[nextIndex]);
                }
              } else if (dayBlocks.length === 0 && dy < -90 && !isLoading) {
                refresh();
              }
            }}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={refresh}
                tintColor={theme.accent}
              />
            }
            renderItem={({ item }) => {
              const itemCollisions = collisions.get(item.id) || [];
              return (
                <BlockCard
                  block={item}
                  onPress={setSelectedBlock}
                  collisionInfo={itemCollisions}
                  currentParity={selectedParity === 'ALL' ? undefined : selectedParity}
                />
              );
            }}
            ListEmptyComponent={
              <EmptyState
                icon="sunny-outline"
                title="Brak zajęć w tym dniu"
                subtitle="Dzień wolny lub brak zaplanowanych zajęć"
              />
            }
          />
        </View>
      )}

      {/* Onboarding Modal */}
      <OnboardingModal
        state={state}
        isOpen={isOnboardingOpen || showInitialOnboarding}
        initialCohort={config.cohort}
        initialPlanType={config.planType}
        initialSelectedSubjects={config.selectedSubjects}
        initialSelectedGroups={config.selectedGroups}
        onSave={handleSaveOnboarding}
        onClose={() => setIsOnboardingOpen(false)}
        isClosable={isConfigured}
      />

      {/* Add Custom Block Modal */}
      <AddCustomBlockModal
        isOpen={isAddCustomOpen}
        onClose={() => setIsAddCustomOpen(false)}
        onAddBlock={addCustomBlock}
        planType={config.planType}
        defaultDay={selectedDay}
      />

      {/* Block Detail Modal */}
      <BlockDetailModal
        block={selectedBlock}
        state={state}
        isOpen={Boolean(selectedBlock)}
        onClose={() => setSelectedBlock(null)}
        onSwitchGroup={setSubjectGroup}
        onSaveOverride={handleSaveOverride}
        onRemoveCustomBlock={removeCustomBlock}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flexOne: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  welcomeIconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 20,
    marginBottom: 12,
  },
  primaryBtn: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  collisionAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: Spacing.three,
    marginTop: 6,
    marginBottom: 6,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  collisionAlertText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.three,
    paddingBottom: 24,
  },
  emptyDayContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyDayTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyDaySub: {
    fontSize: 13,
  },
});
