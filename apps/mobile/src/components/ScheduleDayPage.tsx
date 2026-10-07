import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import {
  type Day,
  type ScheduleBlock,
  detectScheduleCollisions,
  getTeachingWeekInfo,
  isBlockInWeekParity,
} from '@pk-planner/core';

import { BlockCard } from '@/components/BlockCard';
import { PullToRefreshGesture } from '@/components/PullToRefreshGesture';
import { EmptyState } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { type WeekParityFilter } from '@/components/WeekParitySelector';

export interface ScheduleDayPagerProps {
  days: Day[];
  selectedDay: Day;
  onSelectDay: (day: Day) => void;
  blocks: ScheduleBlock[];
  parity: WeekParityFilter;
  collisions: ReturnType<typeof detectScheduleCollisions>;
  onSelectBlock: (block: ScheduleBlock) => void;
  onVerticalScroll: (day: Day, offset: number) => void;
  onSelectedDayScroll: (offset: number) => void;
  onPullMove?: (distance: number) => void;
  onPullEnd?: (completed: boolean) => void;
}

interface ScheduleDayPageProps {
  day: Day;
  blocks: ScheduleBlock[];
  parity: WeekParityFilter;
  collisions: ReturnType<typeof detectScheduleCollisions>;
  onSelectBlock: (block: ScheduleBlock) => void;
  onVerticalScroll: (offset: number) => void;
  onPullMove?: (distance: number) => void;
  onPullEnd?: (completed: boolean) => void;
}

export function ScheduleDayPage({
  day,
  blocks,
  parity,
  collisions,
  onSelectBlock,
  onVerticalScroll,
  onPullMove,
  onPullEnd,
}: ScheduleDayPageProps) {
  const scrollOffset = useRef(0);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const scheduleNextMinute = () => {
      const current = new Date();
      timer = setTimeout(() => {
        setNow(new Date());
        scheduleNextMinute();
      }, 60_000 - current.getSeconds() * 1000 - current.getMilliseconds());
    };
    scheduleNextMinute();
    return () => clearTimeout(timer);
  }, []);
  const currentParity = getTeachingWeekInfo(now).parityLabel;
  const effectiveParity = parity === 'CURRENT' ? currentParity : parity;

  const dayBlocks = useMemo(() => blocks
    .filter(block => block.day === day && (effectiveParity === 'ALL' || isBlockInWeekParity(block, effectiveParity)))
    .sort((a, b) => (a.start ?? 0) - (b.start ?? 0)), [blocks, day, effectiveParity]);

  return (
    <PullToRefreshGesture scrollOffset={scrollOffset} onPullMove={onPullMove} onPullEnd={onPullEnd}>
    <FlatList
      data={dayBlocks}
      extraData={now}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.listContent}
      bounces={false}
      overScrollMode="never"
      scrollEventThrottle={16}
      onScroll={event => {
        scrollOffset.current = Math.max(0, event.nativeEvent.contentOffset.y);
        onVerticalScroll(scrollOffset.current);
      }}
      renderItem={({ item }) => (
        <BlockCard
          block={item}
          onPress={onSelectBlock}
          collisionInfo={collisions.get(item.id) || []}
          currentParity={currentParity}
          dimWhenNotCurrentWeek={parity === 'ALL'}
          now={now}
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
    </PullToRefreshGesture>
  );
}

const styles = StyleSheet.create({
  listContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.three,
    paddingBottom: 24,
  },
});
