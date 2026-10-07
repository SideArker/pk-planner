import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/context/ThemeContext';
import { Spacing } from '@/constants/theme';

interface HeaderProps {
  onAddCustom: () => void;
  title?: string;
}

export function Header({
  onAddCustom,
  title = 'Mój Planner',
}: HeaderProps) {
  const { theme, resolvedTheme } = useAppTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#09090b' : '#ffffff',
          borderBottomColor: theme.border,
        },
      ]}>
      <View style={styles.brandRow}>
        <View style={styles.titleColumn}>
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Plan zajęć
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        <Pressable
          onPress={onAddCustom}
          style={({ pressed }) => [
            styles.addBtn,
            {
              backgroundColor: theme.accent,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
          accessibilityLabel="Dodaj własne zajęcia">
          <Ionicons name="add" size={18} color="#ffffff" />
          <Text style={styles.addText}>Dodaj zajęcia</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  titleColumn: {
    justifyContent: 'center',
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 11,
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addBtn: {
    height: 36,
    borderRadius: 6,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  addText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
