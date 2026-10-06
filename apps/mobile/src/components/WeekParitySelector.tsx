import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/context/ThemeContext';

export type WeekParityFilter = 'A' | 'B' | 'ALL';

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
    { id: 'A', label: 'Tydzień A' },
    { id: 'B', label: 'Tydzień B' },
    { id: 'ALL', label: 'Wszystkie' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View
          style={[
            styles.segmentContainer,
            {
              backgroundColor: isDark ? '#18181b' : '#f1f5f9',
              borderColor: theme.border,
            },
          ]}>
        {options.map((opt) => {
          const isSelected = selectedParity === opt.id;
          return (
            <Pressable
              key={opt.id}
              onPress={() => onSelectParity(opt.id)}
              style={({ pressed }) => [
                styles.segmentItem,
                {
                  backgroundColor: isSelected
                    ? isDark
                      ? '#27272a'
                      : '#ffffff'
                    : 'transparent',
                  opacity: pressed ? 0.8 : 1,
                },
              ]}>
              <Text
                style={[
                  styles.segmentLabel,
                  {
                    color: isSelected ? theme.text : theme.textSecondary,
                    fontWeight: isSelected ? '700' : '500',
                  },
                ]}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.three,
    marginTop: 10,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  segmentContainer: {
    flexDirection: 'row',
    flex: 1,
    padding: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  segmentLabel: {
    fontSize: 12,
  },
});
