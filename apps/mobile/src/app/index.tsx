import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  AppState,
  Text,
  View,
  useAnimatedValue,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  type BlockOverride,
  type Day,
  type PlanType,
  type ScheduleBlock,
  availableDays,
  detectScheduleCollisions,
  getTeachingWeekInfo,
  isBlockInWeekParity,
  resolveUserBlocks,
} from '@pk-planner/core';

import { AddCustomBlockModal } from '@/components/AddCustomBlockModal';
import { BlockDetailModal } from '@/components/BlockDetailModal';
import { DaySelector } from '@/components/DaySelector';
import { Header } from '@/components/Header';
import { OnboardingModal } from '@/components/OnboardingModal';
import { ScheduleDayPager } from '@/components/ScheduleDayPager';
import { ScheduleGrid } from '@/components/ScheduleGrid';
import { WeekParityFilter, WeekParitySelector } from '@/components/WeekParitySelector';
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

const PULL_THRESHOLD = 82;

function springPullTo(value: Animated.Value, toValue: number, onComplete?: () => void) {
  Animated.spring(value, {
    toValue,
    speed: 17,
    bounciness: 6,
    useNativeDriver: true,
  }).start(({ finished }) => {
    if (finished) onComplete?.();
  });
}

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

  const days = useMemo(() => availableDays(config.planType), [config.planType]);

  const [selectedDay, setSelectedDay] = useState<Day>(() => getInitialToday(days));
  const [selectedParity, setSelectedParity] = useState<WeekParityFilter>('ALL');
  const [scheduleView, setScheduleView] = useState<'list' | 'grid'>('list');
  const scrollOffset = useRef(0);
  const isLoadingRef = useRef(isLoading);
  const refreshRef = useRef(refresh);
  const pullOffset = useAnimatedValue(0);
  const spinnerRotation = useAnimatedValue(0);
  const pullDistance = useRef(0);
  const pullRefreshing = useRef(false);
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);
  const [pullReady, setPullReady] = useState(false);
  const weekInfo = getTeachingWeekInfo();
  const effectiveParity = selectedParity === 'CURRENT' ? weekInfo.parityLabel : selectedParity;

  useEffect(() => {
    isLoadingRef.current = isLoading;
    refreshRef.current = refresh;
  }, [isLoading, refresh]);

  useEffect(() => {
    if (!isPullRefreshing) {
      spinnerRotation.setValue(0);
      return;
    }
    const animation = Animated.loop(Animated.timing(spinnerRotation, {
      toValue: 1,
      duration: 800,
      easing: Easing.linear,
      useNativeDriver: true,
    }));
    animation.start();
    return () => animation.stop();
  }, [isPullRefreshing, spinnerRotation]);

  const handlePullMove = useCallback((rawDistance: number) => {
    if (isLoadingRef.current || pullRefreshing.current) return;
    const distance = 112 * (1 - Math.exp(-rawDistance / 140));
    pullDistance.current = distance;
    pullOffset.setValue(distance);
    setPullReady(distance >= PULL_THRESHOLD);
  }, [pullOffset]);

  const handlePullEnd = useCallback((completed: boolean) => {
    if (completed && pullDistance.current >= PULL_THRESHOLD && !isLoadingRef.current) {
      pullRefreshing.current = true;
      setIsPullRefreshing(true);
      springPullTo(pullOffset, 88);
      void refreshRef.current().finally(() => {
        springPullTo(pullOffset, 0, () => {
          pullRefreshing.current = false;
          setIsPullRefreshing(false);
          setPullReady(false);
        });
      });
    } else if (!pullRefreshing.current) {
      setPullReady(false);
      springPullTo(pullOffset, 0);
    }
    pullDistance.current = 0;
  }, [pullOffset]);

  const pullSpin = spinnerRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const pullTilt = pullOffset.interpolate({
    inputRange: [0, PULL_THRESHOLD, 112],
    outputRange: ['0deg', '150deg', '210deg'],
    extrapolate: 'clamp',
  });

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

  // Wejście na apkę automatycznie synchronizuje plan i powiadomienia
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        void refresh();
        if (isLoaded && state) {
          void loadNotificationPreferences().then((preferences) => {
            void syncNotifications(userBlocks, preferences).catch(() => {});
          });
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [refresh, isLoaded, state, userBlocks]);

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
      if (effectiveParity !== 'ALL' && !isBlockInWeekParity(b, effectiveParity)) {
        continue;
      }
      counts[b.day] = (counts[b.day] || 0) + 1;
    }
    return counts;
  }, [userBlocks, effectiveParity]);

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
        <View style={styles.pullViewport}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.pullIndicator,
              {
                backgroundColor: isDark ? '#27272a' : '#ffffff',
                borderColor: theme.border,
                opacity: pullOffset.interpolate({
                  inputRange: [0, 22, 55],
                  outputRange: [0, 0.7, 1],
                  extrapolate: 'clamp',
                }),
                transform: [{
                  translateY: pullOffset.interpolate({
                  inputRange: [0, 88, 112],
                    outputRange: [-16, 0, 12],
                    extrapolate: 'clamp',
                  }),
                }],
              },
            ]}>
            <Animated.View style={{ transform: [{ rotate: isPullRefreshing ? pullSpin : pullTilt }] }}>
              <Ionicons name="refresh" size={17} color={theme.accent} />
            </Animated.View>
            <Text style={[styles.pullIndicatorText, { color: theme.text }]}>
              {isPullRefreshing
                ? 'Odświeżanie planu…'
                : pullReady
                  ? 'Puść, aby odświeżyć'
                  : 'Pociągnij, aby odświeżyć'}
            </Text>
          </Animated.View>
          <Animated.View
            style={[styles.flexOne, { transform: [{ translateY: pullOffset }] }]}>
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

          <View style={styles.viewRow}>
          <View
            style={[styles.viewToggle, { backgroundColor: isDark ? '#18181b' : '#e9edf2' }]}
            accessibilityRole="tablist">
            {([
              { id: 'list', label: 'Lista', icon: 'list-outline' as const },
              { id: 'grid', label: 'Siatka', icon: 'grid-outline' as const },
            ] as const).map((option) => {
              const selected = scheduleView === option.id;
              return (
                <Pressable
                  key={option.id}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                  accessibilityLabel={option.label}
                  onPress={() => {
                    scrollOffset.current = 0;
                    setScheduleView(option.id);
                  }}
                  style={({ pressed }) => [
                    styles.viewToggleButton,
                    {
                      backgroundColor: selected
                        ? isDark ? '#27272a' : '#ffffff'
                        : 'transparent',
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}>
                  <Ionicons name={option.icon} size={18} color={selected ? theme.text : theme.textSecondary} />
                </Pressable>
              );
            })}
          </View>
          <View accessibilityLabel={`Aktualny tydzień ${weekInfo.parityLabel}, numer ${weekInfo.weekNumber}`}>
            <Text style={[styles.weekBadgeText, { color: theme.textSecondary }]}>
              Tydzień {weekInfo.parityLabel}
            </Text>
          </View>
          </View>

          {scheduleView === 'grid' ? (
            <View style={styles.gridContainer}>
              <ScheduleGrid
                blocks={userBlocks}
                planType={config.planType}
                parityFilter={effectiveParity}
                onSelectBlock={setSelectedBlock}
                onVerticalScroll={(offset) => { scrollOffset.current = Math.max(0, offset); }}
                onPullMove={handlePullMove}
                onPullEnd={handlePullEnd}
              />
            </View>
          ) : (
            <>
              <DaySelector
                days={days}
                selectedDay={selectedDay}
                onSelectDay={setSelectedDay}
                dayCounts={dayCounts}
              />
              <ScheduleDayPager
                days={days}
                selectedDay={selectedDay}
                onSelectDay={setSelectedDay}
                blocks={userBlocks}
                parity={selectedParity}
                collisions={collisions}
                onSelectBlock={setSelectedBlock}
                onVerticalScroll={(day, offset) => {
                  if (day === selectedDay) scrollOffset.current = offset;
                }}
                onSelectedDayScroll={(offset) => { scrollOffset.current = offset; }}
                onPullMove={handlePullMove}
                onPullEnd={handlePullEnd}
              />
            </>
          )}
          </Animated.View>
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
        collisionInfo={selectedBlock ? (collisions.get(selectedBlock.id) || []) : []}
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
  pullViewport: {
    flex: 1,
    overflow: 'hidden',
  },
  pullIndicator: {
    position: 'absolute',
    top: 13,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
  },
  pullIndicatorText: {
    fontSize: 12,
    fontWeight: '700',
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
  viewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    justifyContent: 'space-between',
    marginHorizontal: Spacing.three,
    marginBottom: 4,
  },
  viewToggle: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 7,
    backgroundColor: '#e2e8f0',
  },
  viewToggleButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 38,
    height: 34,
    borderRadius: 5,
  },
  weekBadgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  gridContainer: {
    flex: 1,
    paddingHorizontal: Spacing.three,
    paddingBottom: 8,
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
