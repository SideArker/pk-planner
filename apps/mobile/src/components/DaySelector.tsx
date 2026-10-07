import React, { useEffect, useRef } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { type Day, DAY_INFO, DAY_SHORT_LABELS } from '@pk-planner/core';
import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/context/ThemeContext';

interface DaySelectorProps {
  days: Day[];
  selectedDay: Day;
  onSelectDay: (day: Day) => void;
  dayCounts?: Partial<Record<Day, number>>;
}

export function DaySelector({
  days,
  selectedDay,
  onSelectDay,
  dayCounts = {},
}: DaySelectorProps) {
  const { theme, resolvedTheme } = useAppTheme();
  const scrollRef = useRef<ScrollView>(null);
  const dayPositions = useRef<Partial<Record<Day, number>>>({});

  useEffect(() => {
    const x = dayPositions.current[selectedDay];
    if (x != null) scrollRef.current?.scrollTo({ x: Math.max(0, x - 16), animated: true });
  }, [selectedDay]);

  return (
    <View style={[styles.wrapper, {
      backgroundColor: resolvedTheme === 'dark' ? '#18181b' : '#e9edf2',
    }]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {days.map((day, index) => {
          const isSelected = day === selectedDay;
          const count = dayCounts[day] ?? 0;
          const shortName = DAY_SHORT_LABELS[day] || day;
          const fullName = DAY_INFO[day]?.[1] || day;

          return (
            <Pressable
              key={day}
              onPress={() => onSelectDay(day)}
              onLayout={(event) => {
                const x = event.nativeEvent.layout.x;
                dayPositions.current[day] = x;
                if (day === selectedDay) {
                  scrollRef.current?.scrollTo({ x: Math.max(0, x - 16), animated: false });
                }
              }}
              style={({ pressed }) => [
                styles.dayButton,
                {
                  borderBottomColor: isSelected ? theme.accent : 'transparent',
                  borderRightColor: index < days.length - 1 ? theme.border : 'transparent',
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              accessibilityLabel={`${fullName}, ${count} zajęć`}>
              <Text
                style={[
                  styles.dayShort,
                  {
                    color: isSelected ? theme.text : theme.textSecondary,
                  },
                ]}>
                {shortName}
              </Text>

              {count > 0 && (
                  <Text
                    style={[
                      styles.countText,
                      { color: theme.textSecondary },
                    ]}>
                    {count}
                  </Text>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingTop: 4,
    paddingBottom: 8,
    marginHorizontal: Spacing.three,
    marginBottom: 8,
    borderRadius: 9,
    overflow: 'hidden',
  },
  scrollContent: {
    flexDirection: 'row',
  },
  dayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  dayShort: {
    fontSize: 13,
    fontWeight: '700',
  },
  countText: {
    fontSize: 10.5,
    fontWeight: '500',
  },
});
