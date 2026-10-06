import React, { useEffect, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/context/ThemeContext';
import { Spacing } from '@/constants/theme';

interface HeaderProps {
  cohort?: string;
  isLoading: boolean;
  onRefresh: () => void;
  onOpenSettings?: () => void;
  title?: string;
}

export function Header({
  cohort,
  isLoading,
  onRefresh,
  onOpenSettings,
  title = 'PK Planner',
}: HeaderProps) {
  const { theme, resolvedTheme, toggleTheme } = useAppTheme();
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
      {/* Brand & Cohort */}
      <View style={styles.brandRow}>
        <Image
          source={require('@/assets/images/icon.png')}
          style={styles.iconWrapper}
        />

        <View style={styles.titleColumn}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
            {Boolean(cohort) && (
              <View
                style={[
                  styles.cohortBadge,
                  {
                    backgroundColor: isDark ? '#27272a' : '#f1f5f9',
                    borderColor: theme.border,
                  },
                ]}>
                <Text
                  style={[
                    styles.cohortText,
                    { color: isDark ? '#e4e4e7' : '#334155' },
                  ]}
                  numberOfLines={1}>
                  {cohort}
                </Text>
              </View>
            )}
          </View>
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

        {/* Theme toggle */}
        <Pressable
          onPress={toggleTheme}
          style={({ pressed }) => [
            styles.actionBtn,
            {
              backgroundColor: isDark ? '#18181b' : '#f8fafc',
              borderColor: theme.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
          accessibilityLabel="Przełącz motyw">
          <Ionicons
            name={isDark ? 'sunny-outline' : 'moon-outline'}
            size={18}
            color={isDark ? '#fbbf24' : theme.text}
          />
        </Pressable>

        {/* Settings button if provided */}
        {onOpenSettings && (
          <Pressable
            onPress={onOpenSettings}
            style={({ pressed }) => [
              styles.actionBtn,
              {
                backgroundColor: isDark ? '#18181b' : '#f8fafc',
                borderColor: theme.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
            accessibilityLabel="Ustawienia">
            <Ionicons
              name="settings-outline"
              size={18}
              color={theme.text}
            />
          </Pressable>
        )}
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
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleColumn: {
    justifyContent: 'center',
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  cohortBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    maxWidth: 120,
  },
  cohortText: {
    fontSize: 11,
    fontWeight: '600',
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
