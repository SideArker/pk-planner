import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  type BlockCollisionInfo,
  type ScheduleBlock,
  formatActivityName,
  minutesToTime,
  roomLabel,
  teacherDisplay,
} from '@pk-planner/core';
import { getActivityStyle, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/context/ThemeContext';
import { Badge } from '@/components/ui';

interface BlockCardProps {
  block: ScheduleBlock;
  onPress: (block: ScheduleBlock) => void;
  collisionInfo?: BlockCollisionInfo[];
  currentParity?: 'A' | 'B';
  dimWhenNotCurrentWeek?: boolean;
}

export function BlockCard({
  block,
  onPress,
  collisionInfo = [],
  currentParity,
  dimWhenNotCurrentWeek = false,
}: BlockCardProps) {
  const { theme, resolvedTheme } = useAppTheme();
  const actStyle = getActivityStyle(block.activity, resolvedTheme);

  const startTime = minutesToTime(block.start);
  const endTime = minutesToTime((block.start ?? 0) + (block.duration || 90));
  const teacher = teacherDisplay(block);
  const room = roomLabel(block.room);
  const hasCollision = collisionInfo.length > 0;

  const isCurrentParity =
    currentParity != null &&
    block.teachingWeekParity != null &&
    ((block.teachingWeekParity === 1 && currentParity === 'B') ||
      (block.teachingWeekParity === 0 && currentParity === 'A'));

  const isOtherWeek =
    dimWhenNotCurrentWeek &&
    block.teachingWeekParity != null &&
    currentParity != null &&
    !isCurrentParity;

  const parityLabel =
    block.frequency === 'co_2_tygodnie' || block.teachingWeekParity != null
      ? block.teachingWeekParity === 0
        ? 'Tydzień A'
        : block.teachingWeekParity === 1
          ? 'Tydzień B'
          : 'Co 2 tyg.'
      : null;

  const isOnline =
    block.room?.trim().toUpperCase() === 'ONLINE' ||
    block.campus?.trim().toLowerCase() === 'zdalnie';

  return (
    <Pressable
      onPress={() => onPress(block)}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: resolvedTheme === 'dark' ? '#18181b' : '#ffffff',
          borderColor: hasCollision ? theme.destructive : theme.cardBorder,
          borderLeftColor: hasCollision ? theme.destructive : actStyle.border,
          opacity: isOtherWeek ? 0.45 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.99 : 1 }],
        },
      ]}>
      {/* Top badges row */}
      <View style={styles.badgeRow}>
        <View style={styles.badgeGroup}>
          {/* Activity badge */}
          <Badge
            label={formatActivityName(block.activity) || 'Zajęcia'}
            backgroundColor={actStyle.badgeBg}
            textColor={actStyle.badgeText}
          />

          {/* Parity badge */}
          {Boolean(parityLabel) && (
            <Badge
              label={parityLabel!}
              backgroundColor={resolvedTheme === 'dark' ? '#27272a' : '#f1f5f9'}
              textColor={resolvedTheme === 'dark' ? '#d4d4d8' : '#475569'}
            />
          )}

          {/* Custom block badge */}
          {block.isCustom && (
            <Badge
              label="Własne"
              backgroundColor={resolvedTheme === 'dark' ? '#451a03' : '#fef3c7'}
              textColor={resolvedTheme === 'dark' ? '#fde68a' : '#b45309'}
            />
          )}
        </View>

        {/* Collision badge if collision */}
        {hasCollision && (
          <Badge
            label="Kolizja"
            backgroundColor={resolvedTheme === 'dark' ? '#450a0a' : '#fee2e2'}
            textColor={theme.destructive}
            borderColor={theme.destructive}
            icon={<Ionicons name="alert-circle" size={12} color={theme.destructive} />}
          />
        )}
      </View>

      {/* Subject Title */}
      <Text
        style={[
          styles.subjectTitle,
          { color: theme.text },
        ]}>
        {block.subject}
      </Text>

      {/* Meta info grid */}
      <View style={styles.metaContainer}>
        {/* Time */}
        <View style={styles.metaRow}>
          <Ionicons
            name="time-outline"
            size={14}
            color={theme.textSecondary}
          />
          <Text style={[styles.metaText, { color: theme.textSecondary }]}>
            {startTime && endTime ? `${startTime} – ${endTime}` : 'Czas n/d'}
            {block.duration ? ` (${block.duration} min)` : ''}
          </Text>
        </View>

        {/* Room */}
        <View style={styles.metaRow}>
          <Ionicons
            name="location-outline"
            size={14}
            color={isOnline ? '#0ea5e9' : theme.textSecondary}
          />
          <Text
            style={[
              styles.metaText,
              {
                color: isOnline
                  ? '#0ea5e9'
                  : theme.textSecondary,
                fontWeight: isOnline ? '600' : '400',
              },
            ]}>
            {isOnline ? 'Zdalnie (online)' : room ? `Sala ${room}` : 'Sala nieznana'}
          </Text>
        </View>

        {/* Teacher */}
        {Boolean(teacher) && (
          <View style={styles.metaRow}>
            <Ionicons
              name="person-outline"
              size={14}
              color={theme.textSecondary}
            />
            <Text
              style={[styles.metaText, { color: theme.textSecondary }]}
              numberOfLines={1}>
              {teacher}
            </Text>
          </View>
        )}

        {/* Group / Cohort if present */}
        {Boolean(block.group || block.cohort) && (
          <View style={styles.metaRow}>
            <Ionicons
              name="people-outline"
              size={14}
              color={theme.textSecondary}
            />
            <Text
              style={[styles.metaText, { color: theme.textSecondary }]}
              numberOfLines={1}>
              {String(block.group || block.cohort || '')}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderLeftWidth: 4.5,
    padding: Spacing.three,
    marginBottom: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1.5,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 6,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  collisionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  collisionText: {
    fontSize: 11,
    fontWeight: '700',
  },
  subjectTitle: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 8,
  },
  metaContainer: {
    gap: 5,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12.5,
    flexShrink: 1,
  },
});
