import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View, useAnimatedValue } from 'react-native';
import {
  type Day,
  type PlanType,
  type ScheduleBlock,
  availableDays,
  DAY_INDEX_TO_DAY,
  DAY_INFO,
  detectScheduleCollisions,
  formatActivityName,
  getTeachingWeekInfo,
  isBlockActiveNow,
  isBlockInWeekParity,
  minutesToTime,
  roomLabel,
} from '@pk-planner/core';
import { useAppTheme } from '@/context/ThemeContext';
import { PullToRefreshGesture } from '@/components/PullToRefreshGesture';

const HOUR_HEIGHT = 72;
const HOUR_WIDTH = 52;
const DAY_WIDTH = 176;
const HEADER_HEIGHT = 48;
const DEFAULT_DURATION = 90;

export type ScheduleGridParityFilter = 'ALL' | 'A' | 'B';

export interface ScheduleGridProps {
  blocks: ScheduleBlock[];
  planType: PlanType;
  parityFilter?: ScheduleGridParityFilter;
  currentTime?: Date;
  onSelectBlock: (block: ScheduleBlock) => void;
  onVerticalScroll?: (offset: number) => void;
  onPullMove?: (distance: number) => void;
  onPullEnd?: (completed: boolean) => void;
}

interface PositionedBlock {
  block: ScheduleBlock;
  top: number;
  height: number;
  left: number;
  width: number;
}

function blockDuration(block: ScheduleBlock): number {
  return block.duration && block.duration > 0 ? block.duration : DEFAULT_DURATION;
}

// Keep overlapping lessons in separate lanes, like the web timetable.
function positionDayBlocks(blocks: ScheduleBlock[], startHour: number): PositionedBlock[] {
  const sorted = [...blocks].sort((a, b) =>
    (a.start! - b.start!) || (blockDuration(b) - blockDuration(a)),
  );
  const clusters: ScheduleBlock[][] = [];
  let cluster: ScheduleBlock[] = [];
  let clusterEnd = -1;

  for (const block of sorted) {
    const end = block.start! + blockDuration(block);
    if (cluster.length && block.start! >= clusterEnd) {
      clusters.push(cluster);
      cluster = [];
      clusterEnd = -1;
    }
    cluster.push(block);
    clusterEnd = Math.max(clusterEnd, end);
  }
  if (cluster.length) clusters.push(cluster);

  const positioned: PositionedBlock[] = [];
  for (const group of clusters) {
    const laneEnds: number[] = [];
    const lanes = new Map<ScheduleBlock, number>();

    for (const block of group) {
      let lane = laneEnds.findIndex(end => end <= block.start!);
      if (lane === -1) lane = laneEnds.length;
      laneEnds[lane] = block.start! + blockDuration(block);
      lanes.set(block, lane);
    }

    const laneWidth = DAY_WIDTH / laneEnds.length;
    for (const block of group) {
      positioned.push({
        block,
        top: (block.start! - startHour * 60) * HOUR_HEIGHT / 60 + 2,
        height: Math.max(30, blockDuration(block) * HOUR_HEIGHT / 60 - 4),
        left: lanes.get(block)! * laneWidth + 2,
        width: laneWidth - 4,
      });
    }
  }
  return positioned;
}

/** A horizontally and vertically scrollable weekly timetable. The parent owns its controls. */
export function ScheduleGrid({
  blocks,
  planType,
  parityFilter = 'ALL',
  currentTime,
  onSelectBlock,
  onVerticalScroll,
  onPullMove,
  onPullEnd,
}: ScheduleGridProps) {
  const scrollOffset = useRef(0);
  const { theme } = useAppTheme();
  const [tickTime, setTickTime] = useState(() => new Date());
  useEffect(() => {
    if (currentTime) return;
    let timer: ReturnType<typeof setTimeout>;
    const scheduleNextMinute = () => {
      const now = new Date();
      timer = setTimeout(() => {
        setTickTime(new Date());
        scheduleNextMinute();
      }, 60_000 - now.getSeconds() * 1000 - now.getMilliseconds());
    };
    scheduleNextMinute();
    return () => clearTimeout(timer);
  }, [currentTime]);
  const now = currentTime ?? tickTime;
  const currentParity = getTeachingWeekInfo(now).parityLabel;
  const today = DAY_INDEX_TO_DAY[now.getDay()];

  const layout = useMemo(() => {
    const days = availableDays(planType);
    const visible = blocks.filter(block =>
      block.day &&
      days.includes(block.day) &&
      block.start != null &&
      Number.isFinite(block.start) &&
      block.start >= 0 &&
      block.start < 24 * 60 &&
      (parityFilter === 'ALL' || isBlockInWeekParity(block, parityFilter)),
    );
    const first = visible.length
      ? Math.min(...visible.map(block => block.start!))
      : 7 * 60;
    const last = visible.length
      ? Math.max(...visible.map(block => block.start! + blockDuration(block)))
      : 22 * 60;
    const startHour = Math.min(7, Math.floor(first / 60));
    const endHour = Math.max(22, Math.ceil(last / 60));
    const hours = Array.from({ length: endHour - startHour }, (_, index) => startHour + index);
    const positioned = new Map<Day, PositionedBlock[]>();
    const counts = new Map<Day, number>();

    for (const day of days) {
      const dayBlocks = visible.filter(block => block.day === day);
      counts.set(day, dayBlocks.length);
      positioned.set(day, positionDayBlocks(dayBlocks, startHour));
    }

    return {
      days,
      hours,
      counts,
      positioned,
      collisions: detectScheduleCollisions(visible),
      startMinute: startHour * 60,
      endMinute: endHour * 60,
    };
  }, [blocks, planType, parityFilter]);

  const nowMinute = now.getHours() * 60 + now.getMinutes();
  const nowDay = now.toDateString();
  const showNow = nowMinute >= layout.startMinute && nowMinute < layout.endMinute;
  const nowTop = (nowMinute - layout.startMinute) * HOUR_HEIGHT / 60;
  const indicatorY = useAnimatedValue(nowTop);
  const previousPosition = useRef({
    day: nowDay,
    startMinute: layout.startMinute,
    minute: nowMinute,
  });

  useEffect(() => {
    if (previousPosition.current.day !== nowDay ||
        previousPosition.current.startMinute !== layout.startMinute ||
        Math.abs(previousPosition.current.minute - nowMinute) > 1) {
      indicatorY.setValue(nowTop);
    } else {
      const animation = Animated.timing(indicatorY, {
        toValue: nowTop,
        duration: 900,
        useNativeDriver: true,
      });
      animation.start();
      previousPosition.current = { day: nowDay, startMinute: layout.startMinute, minute: nowMinute };
      return () => animation.stop();
    }
    previousPosition.current = { day: nowDay, startMinute: layout.startMinute, minute: nowMinute };
  }, [indicatorY, layout.startMinute, nowTop, nowDay, nowMinute]);

  return (
    <PullToRefreshGesture scrollOffset={scrollOffset} onPullMove={onPullMove} onPullEnd={onPullEnd}>
    <ScrollView
      nestedScrollEnabled
      bounces={false}
      overScrollMode="never"
      style={styles.verticalScroll}
      showsVerticalScrollIndicator
      scrollEventThrottle={16}
      onScroll={(event) => {
        scrollOffset.current = Math.max(0, event.nativeEvent.contentOffset.y);
        onVerticalScroll?.(scrollOffset.current);
      }}>
      <View style={styles.gridRow}>
          <View style={{ width: HOUR_WIDTH }}>
            <View style={[styles.hourHeader, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.hourHeaderText, { color: theme.textSecondary }]}>Godz.</Text>
            </View>
            <View style={[styles.hourAxis, { height: layout.hours.length * HOUR_HEIGHT, borderColor: theme.border }]}>
              {layout.hours.map(hour => (
                <View key={hour} style={[styles.hourCell, { borderColor: theme.border }]}>
                  <Text style={[styles.hourText, { color: theme.textSecondary }]}>
                    {String(hour).padStart(2, '0')}:00
                  </Text>
                </View>
              ))}
              {showNow && (
                <Animated.View
                  pointerEvents="none"
                  style={[styles.currentTimeBadge, {
                    backgroundColor: theme.accent,
                    transform: [{ translateY: indicatorY }],
                  }]}>
                  <Text style={styles.currentTimeText}>{minutesToTime(nowMinute)}</Text>
                </Animated.View>
              )}
            </View>
          </View>

        <ScrollView horizontal nestedScrollEnabled style={styles.dayScroll} showsHorizontalScrollIndicator>
          <View style={styles.dayRow}>
          {layout.days.map(day => {
            const isToday = today === day;
            return (
              <View key={day} style={{ width: DAY_WIDTH }}>
                <View style={[
                  styles.dayHeader,
                  {
                    backgroundColor: isToday ? theme.backgroundElement : theme.card,
                    borderColor: theme.border,
                  },
                ]}>
                  <Text style={[styles.dayName, { color: theme.text }]}>
                    {DAY_INFO[day][0]}
                  </Text>
                  <Text style={[styles.dayCount, { color: theme.textSecondary }]}>
                    {layout.counts.get(day) ?? 0}
                  </Text>
                </View>

                <View style={[
                  styles.dayColumn,
                  {
                    height: layout.hours.length * HOUR_HEIGHT,
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                  },
                ]}>
                  {layout.hours.map(hour => (
                    <View key={hour} style={[styles.hourLine, { borderColor: theme.border }]}>
                      <View style={[styles.halfHourLine, { borderColor: theme.border }]} />
                    </View>
                  ))}

                  {layout.positioned.get(day)?.map(({ block, top, height, left, width }) => {
                    const hasCollision = layout.collisions.has(block.id);
                    const isOtherWeek = parityFilter === 'ALL' &&
                      block.teachingWeekParity != null &&
                      !isBlockInWeekParity(block, currentParity);
                    const isCurrent = isToday && isBlockActiveNow(block, now, currentParity);
                    const short = height < 74;
                    const room = roomLabel(block.room);
                    const period = block.teachingWeekParity === 0
                      ? ' · A'
                      : block.teachingWeekParity === 1
                        ? ' · B'
                        : block.frequency === 'co_2_tygodnie' ? ' · co 2 tyg.' : '';

                    return (
                      <Pressable
                        key={block.id}
                        onPress={() => onSelectBlock(block)}
                        accessibilityRole="button"
                        accessibilityLabel={`${block.subject}, ${DAY_INFO[day][0]}, ${minutesToTime(block.start)}–${minutesToTime(block.start! + blockDuration(block))}`}
                        style={({ pressed }) => [
                          styles.block,
                          {
                            top,
                            height,
                            left,
                            width,
                            backgroundColor: theme.card,
                            borderColor: theme.cardBorder,
                            borderLeftColor: isCurrent ? theme.accent : theme.cardBorder,
                            borderLeftWidth: isCurrent ? 3 : 1,
                            opacity: pressed ? 0.75 : isOtherWeek ? 0.48 : 1,
                          },
                        ]}>
                        {height >= 48 && (
                          <Text numberOfLines={1} style={[styles.blockMeta, { color: theme.textSecondary }]}>
                            {formatActivityName(block.activity) || 'Zajęcia'}{period}
                            {hasCollision ? ' · Kolizja' : isCurrent ? ' · Teraz' : ''}
                          </Text>
                        )}
                        <Text numberOfLines={short ? 1 : 2} style={[styles.blockTitle, { color: theme.text }]}>
                          {block.subject}
                        </Text>
                        {!short && (
                          <Text numberOfLines={1} style={[styles.blockDetails, { color: theme.textSecondary }]}>
                            {minutesToTime(block.start)}–{minutesToTime(block.start! + blockDuration(block))}
                            {room ? ` · ${room}` : ''}
                          </Text>
                        )}
                      </Pressable>
                    );
                  })}

                  {showNow && (
                    <Animated.View
                      pointerEvents="none"
                      style={[styles.currentTimeLine, { transform: [{ translateY: indicatorY }] }]}>
                      {isToday && <View style={[styles.currentTimeDot, { backgroundColor: theme.accent }]} />}
                      <View style={[
                        styles.currentTimeStroke,
                        {
                          backgroundColor: isToday ? theme.accent : 'transparent',
                          borderColor: isToday ? theme.accent : theme.border,
                          opacity: isToday ? 1 : 0.5,
                        },
                      ]} />
                    </Animated.View>
                  )}
                </View>
              </View>
            );
          })}
          </View>
        </ScrollView>
      </View>
    </ScrollView>
    </PullToRefreshGesture>
  );
}

const styles = StyleSheet.create({
  verticalScroll: { flex: 1, maxHeight: 640 },
  gridRow: { flexDirection: 'row', width: '100%' },
  dayScroll: { flex: 1 },
  dayRow: { flexDirection: 'row' },
  hourHeader: {
    height: HEADER_HEIGHT,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hourHeaderText: { fontSize: 10, fontWeight: '700' },
  hourAxis: { borderWidth: 1, borderTopWidth: 0 },
  hourCell: {
    height: HOUR_HEIGHT,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    paddingTop: 5,
  },
  hourText: { fontSize: 10, fontVariant: ['tabular-nums'] },
  dayHeader: {
    height: HEADER_HEIGHT,
    borderWidth: 1,
    borderLeftWidth: 0,
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayName: { fontSize: 13, fontWeight: '700' },
  dayCount: { fontSize: 11, fontWeight: '600' },
  dayColumn: { position: 'relative', borderRightWidth: 1, borderBottomWidth: 1 },
  hourLine: { height: HOUR_HEIGHT, borderBottomWidth: StyleSheet.hairlineWidth },
  halfHourLine: {
    position: 'absolute',
    top: HOUR_HEIGHT / 2,
    left: 0,
    right: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    opacity: 0.5,
  },
  block: {
    position: 'absolute',
    borderWidth: 1,
    borderLeftWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  blockMeta: { fontSize: 9, fontWeight: '700', marginBottom: 2 },
  blockTitle: { fontSize: 11, lineHeight: 14, fontWeight: '700' },
  blockDetails: { fontSize: 9, marginTop: 3 },
  currentTimeBadge: {
    position: 'absolute',
    top: -9,
    left: 2,
    right: 2,
    borderRadius: 4,
    paddingVertical: 2,
    alignItems: 'center',
  },
  currentTimeText: { color: '#ffffff', fontSize: 9, fontWeight: '700' },
  currentTimeLine: {
    position: 'absolute',
    top: -4,
    left: 0,
    right: 0,
    height: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentTimeDot: { width: 8, height: 8, borderRadius: 4 },
  currentTimeStroke: { flex: 1, height: 2, borderTopWidth: 1, borderStyle: 'dashed' },
});
