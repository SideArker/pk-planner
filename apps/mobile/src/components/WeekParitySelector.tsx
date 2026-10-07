import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/context/ThemeContext';

export type WeekParityFilter = 'A' | 'B' | 'ALL' | 'CURRENT';

interface WeekParitySelectorProps {
  selectedParity: WeekParityFilter;
  onSelectParity: (parity: WeekParityFilter) => void;
}

export function WeekParitySelector({
  selectedParity,
  onSelectParity,
}: WeekParitySelectorProps) {
  const { theme, resolvedTheme } = useAppTheme();
  const isDark = resolvedTheme === 'dark';

  const options: { id: WeekParityFilter; label: string }[] = [
    { id: 'ALL', label: 'Wszystkie' },
    { id: 'CURRENT', label: 'Bieżący' },
    { id: 'A', label: 'Tydzień A' },
    { id: 'B', label: 'Tydzień B' },
  ];

  return (
    <View style={styles.container}>
        <View
          style={[
            styles.segmentContainer,
            {
              backgroundColor: isDark ? '#18181b' : '#e9edf2',
            },
          ]}
          accessibilityRole="tablist">
        {options.map((opt) => {
          const isSelected = selectedParity === opt.id;
          return (
            <Pressable
              key={opt.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: isSelected }}
              onPress={() => onSelectParity(opt.id)}
              style={({ pressed }) => [
                styles.segmentItem,
                {
                  backgroundColor: isSelected
                    ? isDark ? '#303036' : '#ffffff'
                    : 'transparent',
                  opacity: pressed ? 0.8 : 1,
                },
              ]}>
              <Text
                style={[
                  styles.segmentLabel,
                  {
                    color: isSelected ? theme.text : theme.textSecondary,
                    fontWeight: isSelected ? '600' : '500',
                  },
                ]}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
        </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.three,
    marginTop: 12,
    marginBottom: 10,
  },
  segmentContainer: {
    flexDirection: 'row',
    flex: 1,
    padding: 3,
    borderRadius: 7,
  },
  segmentItem: {
    flex: 1,
    minHeight: 36,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
  },
  segmentLabel: {
    fontSize: 11,
  },
});
