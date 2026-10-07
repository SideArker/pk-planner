import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { type ScheduleBlock } from '@pk-planner/core';

import { ScheduleDayPage, type ScheduleDayPagerProps } from '@/components/ScheduleDayPage';

// The native implementation uses Expo UI's pager; web keeps the touch fallback.
export function ScheduleDayPager({
  days,
  selectedDay,
  onSelectDay,
  blocks,
  parity,
  collisions,
  onSelectBlock,
  onVerticalScroll,
  onSelectedDayScroll,
  onPullMove,
  onPullEnd,
}: ScheduleDayPagerProps) {
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const pressBlockedUntil = useRef(0);

  useEffect(() => {
    onSelectedDayScroll(0);
  }, [selectedDay, onSelectedDayScroll]);

  const handleSelectBlock = (block: ScheduleBlock) => {
    if (Date.now() >= pressBlockedUntil.current) onSelectBlock(block);
  };

  return (
    <View
      style={{ flex: 1 }}
      onTouchStart={event => {
        touchStart.current = { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY };
      }}
      onTouchMove={event => {
        const start = touchStart.current;
        if (start && Math.abs(event.nativeEvent.pageX - start.x) > 10) {
          pressBlockedUntil.current = Date.now() + 150;
        }
      }}
      onTouchEnd={event => {
        const start = touchStart.current;
        touchStart.current = null;
        if (!start) return;
        const dx = event.nativeEvent.pageX - start.x;
        const dy = event.nativeEvent.pageY - start.y;
        if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.3) {
          pressBlockedUntil.current = Date.now() + 150;
          const next = days.indexOf(selectedDay) + (dx < 0 ? 1 : -1);
          if (days[next]) onSelectDay(days[next]);
        }
      }}
      onTouchCancel={() => { touchStart.current = null; }}>
      <ScheduleDayPage
        day={selectedDay}
        blocks={blocks}
        parity={parity}
        collisions={collisions}
        onSelectBlock={handleSelectBlock}
        onPullMove={onPullMove}
        onPullEnd={onPullEnd}
        onVerticalScroll={offset => onVerticalScroll(selectedDay, offset)}
      />
    </View>
  );
}
