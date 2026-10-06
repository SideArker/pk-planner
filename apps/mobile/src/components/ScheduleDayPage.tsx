import React, { useMemo } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import {
  type Day,
  type ScheduleBlock,
  detectScheduleCollisions,
  getTeachingWeekInfo,
  isBlockInWeekParity,
} from '@pk-planner/core';

import { BlockCard } from '@/components/BlockCard';
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
}

interface ScheduleDayPageProps {
  day: Day;
  blocks: ScheduleBlock[];
  parity: WeekParityFilter;
  collisions: ReturnType<typeof detectScheduleCollisions>;
  onSelectBlock: (block: ScheduleBlock) => void;
  onVerticalScroll: (offset: number) => void;
}

export function ScheduleDayPage({
  day,
  blocks,
  parity,
  collisions,
  onSelectBlock,
  onVerticalScroll,
}: ScheduleDayPageProps) {
  const weekInfo = useMemo(() => getTeachingWeekInfo(), []);

  const dayBlocks = useMemo(() => blocks
    .filter(block => block.day === day && (parity === 'ALL' || isBlockInWeekParity(block, parity)))
    .sort((a, b) => (a.start ?? 0) - (b.start ?? 0)), [blocks, day, parity]);

  return (
    <FlatList
      data={dayBlocks}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.listContent}
      bounces={false}
      overScrollMode="never"
      scrollEventThrottle={16}
      onScroll={event => onVerticalScroll(Math.max(0, event.nativeEvent.contentOffset.y))}
      renderItem={({ item }) => (
        <BlockCard
          block={item}
          onPress={onSelectBlock}
          collisionInfo={collisions.get(item.id) || []}
          currentParity={weekInfo.parityLabel}
          dimWhenNotCurrentWeek={parity === 'ALL'}
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
  );
}

const styles = StyleSheet.create({
  listContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.three,
    paddingBottom: 24,
  },
});
