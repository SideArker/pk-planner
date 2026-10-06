import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  PanResponder,
  Pressable,
  StyleSheet,
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
import { BlockCard } from '@/components/BlockCard';
import { BlockDetailModal } from '@/components/BlockDetailModal';
import { DaySelector } from '@/components/DaySelector';
import { Header } from '@/components/Header';
import { OnboardingModal } from '@/components/OnboardingModal';
import { ScheduleGrid } from '@/components/ScheduleGrid';
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

const PULL_THRESHOLD = 62;

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
  const touchStart = useRef<{ x: number; y: number } | null>(null);
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

  // The responder reads these refs only when a touch event occurs.
  // oxlint-disable-next-line react/refs
  const [panResponder] = useState(() => PanResponder.create({
    onMoveShouldSetPanResponderCapture: (_, gesture) =>
      gesture.numberActiveTouches === 1 &&
      !isLoadingRef.current &&
      !pullRefreshing.current &&
      scrollOffset.current <= 1 &&
      gesture.dy > 8 &&
      gesture.dy > Math.abs(gesture.dx) * 1.4,
    onPanResponderGrant: () => pullOffset.stopAnimation(),
    onPanResponderMove: (_, gesture) => {
      // The resistance increases as the content approaches its maximum travel.
      const distance = 112 * (1 - Math.exp(-Math.max(0, gesture.dy) / 140));
      pullDistance.current = distance;
      pullOffset.setValue(distance);
      setPullReady(distance >= PULL_THRESHOLD);
    },
    onPanResponderRelease: () => {
      if (pullDistance.current >= PULL_THRESHOLD && !isLoadingRef.current) {
        pullRefreshing.current = true;
        setIsPullRefreshing(true);
        springPullTo(pullOffset, 68);
        void refreshRef.current().finally(() => {
          springPullTo(pullOffset, 0, () => {
            pullRefreshing.current = false;
            setIsPullRefreshing(false);
            setPullReady(false);
          });
        });
      } else {
        setPullReady(false);
        springPullTo(pullOffset, 0);
      }
      pullDistance.current = 0;
    },
    onPanResponderTerminate: () => {
      pullDistance.current = 0;
      setPullReady(false);
      springPullTo(pullOffset, 0);
    },
  }));

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
                    inputRange: [0, 68, 112],
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
            style={[styles.flexOne, { transform: [{ translateY: pullOffset }] }]}
            {...panResponder.panHandlers}>
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
            style={[styles.viewToggle, { backgroundColor: isDark ? '#18181b' : '#e2e8f0' }]}
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
                  <Ionicons name={option.icon} size={15} color={selected ? theme.text : theme.textSecondary} />
                  <Text style={[styles.viewToggleText, {
                    color: selected ? theme.text : theme.textSecondary,
                    fontWeight: selected ? '700' : '500',
                  }]}>{option.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <View
            accessibilityLabel={`Aktualny tydzień ${weekInfo.parityLabel}, numer ${weekInfo.weekNumber}`}
            style={[styles.weekBadge, { backgroundColor: isDark ? '#27272a' : '#e2e8f0' }]}>
            <Text style={[styles.weekBadgeText, { color: theme.text }]}>
              Tydzień {weekInfo.parityLabel}
            </Text>
          </View>
          </View>

          {scheduleView === 'grid' ? (
            <View style={styles.gridContainer}>
              <ScheduleGrid
                blocks={userBlocks}
                planType={config.planType}
                parityFilter={selectedParity}
                onSelectBlock={setSelectedBlock}
                onVerticalScroll={(offset) => { scrollOffset.current = Math.max(0, offset); }}
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
              <FlatList
                data={dayBlocks}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                bounces={false}
                overScrollMode="never"
                scrollEventThrottle={16}
                onScroll={(event) => {
                  scrollOffset.current = Math.max(0, event.nativeEvent.contentOffset.y);
                }}
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
                  }
                }}
                renderItem={({ item }) => (
                  <BlockCard
                    block={item}
                    onPress={setSelectedBlock}
                    collisionInfo={collisions.get(item.id) || []}
                    currentParity={selectedParity === 'ALL' ? undefined : selectedParity}
                  />
                )}
                ListEmptyComponent={
                  <EmptyState
                    icon="sunny-outline"
                    title="Brak zajęć w tym dniu"
                    subtitle="Dzień wolny lub brak zaplanowanych zajęć"
                  />
                }
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
  listContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.three,
    paddingBottom: 24,
  },
  viewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: Spacing.three,
    marginBottom: 4,
  },
  viewToggle: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 10,
    backgroundColor: '#e2e8f0',
  },
  viewToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    minWidth: 76,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewToggleText: {
    fontSize: 12,
  },
  weekBadge: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 9,
  },
  weekBadgeText: {
    fontSize: 11,
    fontWeight: '700',
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
