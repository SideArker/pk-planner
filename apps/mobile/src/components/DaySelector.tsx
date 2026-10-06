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
  const isDark = resolvedTheme === 'dark';
  const scrollRef = useRef<ScrollView>(null);
  const dayPositions = useRef<Partial<Record<Day, number>>>({});

  useEffect(() => {
    const x = dayPositions.current[selectedDay];
    if (x != null) scrollRef.current?.scrollTo({ x: Math.max(0, x - 16), animated: true });
  }, [selectedDay]);

  return (
    <View style={styles.wrapper}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {days.map((day) => {
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
                  backgroundColor: isSelected
                    ? isDark
                      ? '#fafafa'
                      : '#18181b'
                    : isDark
                      ? '#18181b'
                      : '#ffffff',
                  borderColor: isSelected
                    ? isDark
                      ? '#fafafa'
                      : '#18181b'
                    : theme.border,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              accessibilityLabel={`${fullName}, ${count} zajęć`}>
              <Text
                style={[
                  styles.dayShort,
                  {
                    color: isSelected
                      ? isDark
                        ? '#09090b'
                        : '#ffffff'
                      : theme.text,
                  },
                ]}>
                {shortName}
              </Text>

              {count > 0 && (
                <View
                  style={[
                    styles.countPill,
                    {
                      backgroundColor: isSelected
                        ? isDark
                          ? '#27272a'
                          : '#3f3f46'
                        : isDark
                          ? '#27272a'
                          : '#f1f5f9',
                    },
                  ]}>
                  <Text
                    style={[
                      styles.countText,
                      {
                        color: isSelected
                          ? '#ffffff'
                          : theme.textSecondary,
                      },
                    ]}>
                    {count}
                  </Text>
                </View>
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
    paddingVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: Spacing.three,
    gap: 8,
    flexDirection: 'row',
  },
  dayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  dayShort: {
    fontSize: 13,
    fontWeight: '700',
  },
  countPill: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 8,
    minWidth: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
});
