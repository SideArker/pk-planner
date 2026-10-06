import React, { useEffect, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/context/ThemeContext';
import { Spacing } from '@/constants/theme';

interface HeaderProps {
  isLoading: boolean;
  onRefresh: () => void;
  onAddCustom: () => void;
  title?: string;
}

export function Header({
  isLoading,
  onRefresh,
  onAddCustom,
  title = 'Mój Planner',
}: HeaderProps) {
  const { theme, resolvedTheme } = useAppTheme();
  const [spinValue] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 900,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ).start();
    } else {
      spinValue.setValue(0);
    }
  }, [isLoading, spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

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
        {/* Refresh button */}
        <Pressable
          onPress={onRefresh}
          disabled={isLoading}
          style={({ pressed }) => [
            styles.actionBtn,
            {
              backgroundColor: isDark ? '#18181b' : '#f8fafc',
              borderColor: theme.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
          accessibilityLabel="Odśwież plan">
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Ionicons
              name="reload-outline"
              size={18}
              color={theme.text}
            />
          </Animated.View>
        </Pressable>

        <Pressable
          onPress={onAddCustom}
          style={({ pressed }) => [
            styles.actionBtn,
            {
              backgroundColor: isDark ? '#18181b' : '#f8fafc',
              borderColor: theme.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
          accessibilityLabel="Dodaj własne zajęcia">
          <Ionicons name="add" size={20} color={theme.text} />
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
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
