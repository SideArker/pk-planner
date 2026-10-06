import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import PagerView, {
  type PageScrollStateChangedEvent,
  type PagerViewOnPageSelectedEvent,
  type PagerViewRef,
} from '@expo/ui/community/pager-view';
import { type Day, type ScheduleBlock } from '@pk-planner/core';

import { ScheduleDayPage, type ScheduleDayPagerProps } from '@/components/ScheduleDayPage';

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
}: ScheduleDayPagerProps) {
  const pagerRef = useRef<PagerViewRef>(null);
  const [initialPage] = React.useState(() => Math.max(0, days.indexOf(selectedDay)));
  const selectedPage = useRef(initialPage);
  const scrollOffsets = useRef<Partial<Record<Day, number>>>({});
  const blockPress = useRef(false);
  const unblockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (unblockTimer.current) clearTimeout(unblockTimer.current);
  }, []);

  useEffect(() => {
    const nextPage = days.indexOf(selectedDay);
    if (nextPage >= 0 && nextPage !== selectedPage.current) {
      pagerRef.current?.setPage(nextPage);
    }
  }, [days, selectedDay]);

  const handleSelectBlock = (block: ScheduleBlock) => {
    if (!blockPress.current) onSelectBlock(block);
  };

  const scheduleUnblock = () => {
    if (unblockTimer.current) clearTimeout(unblockTimer.current);
    unblockTimer.current = setTimeout(() => { blockPress.current = false; }, 150);
  };

  const handlePageStateChange = (event: PageScrollStateChangedEvent) => {
    const state = event.nativeEvent.pageScrollState;
    if (state === 'dragging') {
      if (unblockTimer.current) clearTimeout(unblockTimer.current);
      blockPress.current = true;
    } else if (state === 'idle') {
      scheduleUnblock();
    }
  };

  const handlePageSelected = (event: PagerViewOnPageSelectedEvent) => {
    const page = event.nativeEvent.position;
    const day = days[page];
    if (!day) return;
    selectedPage.current = page;
    blockPress.current = true;
    scheduleUnblock();
    onSelectedDayScroll(scrollOffsets.current[day] ?? 0);
    onSelectDay(day);
  };

  return (
    <PagerView
      ref={pagerRef}
      style={{ flex: 1 }}
      initialPage={initialPage}
      onPageScrollStateChanged={handlePageStateChange}
      onPageSelected={handlePageSelected}>
      {days.map(day => (
        <View key={day} style={{ flex: 1 }} collapsable={false}>
          <ScheduleDayPage
            day={day}
            blocks={blocks}
            parity={parity}
            collisions={collisions}
            onSelectBlock={handleSelectBlock}
            onVerticalScroll={offset => {
              scrollOffsets.current[day] = offset;
              onVerticalScroll(day, offset);
            }}
          />
        </View>
      ))}
    </PagerView>
  );
}
