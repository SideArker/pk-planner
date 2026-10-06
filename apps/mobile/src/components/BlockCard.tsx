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

  const isDark = resolvedTheme === 'dark';

  return (
    <Pressable
      onPress={() => onPress(block)}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: isOtherWeek
            ? isDark ? '#121214' : '#f8fafc'
            : isDark ? '#18181b' : '#ffffff',
          borderColor: hasCollision
            ? theme.destructive
            : isOtherWeek
              ? isDark ? '#27272a' : '#e2e8f0'
              : theme.cardBorder,
          borderLeftColor: hasCollision
            ? theme.destructive
            : isOtherWeek
              ? isDark ? '#3f3f46' : '#94a3b8'
              : actStyle.border,
          opacity: isOtherWeek ? 0.5 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.99 : 1 }],
        },
      ]}>
      {/* Top badges row */}
      <View style={styles.badgeRow}>
        <View style={styles.badgeGroup}>
          {/* Activity badge */}
          <Badge
            label={formatActivityName(block.activity) || 'Zajęcia'}
            backgroundColor={isOtherWeek ? (isDark ? '#27272a' : '#e2e8f0') : actStyle.badgeBg}
            textColor={isOtherWeek ? (isDark ? '#a1a1aa' : '#64748b') : actStyle.badgeText}
          />

          {/* Parity badge */}
          {Boolean(parityLabel) && (
            <Badge
              label={`${parityLabel}${isOtherWeek ? ' (inny tydzień)' : isCurrentParity ? ' (bieżący)' : ''}`}
              backgroundColor={
                isCurrentParity
                  ? isDark ? '#1e3a5f' : '#dbeafe'
                  : isDark ? '#27272a' : '#f1f5f9'
              }
              textColor={
                isCurrentParity
                  ? isDark ? '#93c5fd' : '#1d4ed8'
                  : isDark ? '#d4d4d8' : '#475569'
              }
            />
          )}

          {/* Custom block badge */}
          {block.isCustom && (
            <Badge
              label="Własne"
              backgroundColor={isDark ? '#451a03' : '#fef3c7'}
              textColor={isDark ? '#fde68a' : '#b45309'}
            />
          )}
        </View>

        {/* Collision badge if collision */}
        {hasCollision && (
          <Badge
            label="Kolizja"
            backgroundColor={isDark ? '#450a0a' : '#fee2e2'}
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
          { color: isOtherWeek ? theme.textSecondary : theme.text },
        ]}>
        {block.subject}
      </Text>

      {/* Wyróżniona godzina i sala */}
      <View style={styles.keyInfoRow}>
        {/* Wyróżniona Godzina */}
        <View
          style={[
            styles.timeBadge,
            {
              backgroundColor: isOtherWeek
                ? isDark ? '#1f1f23' : '#f1f5f9'
                : isDark ? '#27272a' : '#f8fafc',
              borderColor: isOtherWeek
                ? isDark ? '#27272a' : '#e2e8f0'
                : isDark ? '#3f3f46' : '#e2e8f0',
            },
          ]}>
          <Ionicons
            name="time"
            size={14}
            color={isOtherWeek ? theme.textSecondary : theme.accent}
          />
          <Text
            style={[
              styles.timeText,
              { color: isOtherWeek ? theme.textSecondary : theme.text },
            ]}>
            {startTime && endTime ? `${startTime} – ${endTime}` : 'Czas n/d'}
          </Text>
          {Boolean(block.duration) && (
            <Text style={[styles.durationText, { color: theme.textSecondary }]}>
              {block.duration}m
            </Text>
          )}
        </View>

        {/* Wyróżniona Sala */}
        <View
          style={[
            styles.roomBadge,
            {
              backgroundColor: isOnline
                ? isDark ? '#082f49' : '#e0f2fe'
                : isOtherWeek
                  ? isDark ? '#18181b' : '#f1f5f9'
                  : isDark ? '#1e1b4b' : '#ede9fe',
              borderColor: isOnline
                ? isDark ? '#0284c7' : '#7dd3fc'
                : isOtherWeek
                  ? isDark ? '#27272a' : '#cbd5e1'
                  : isDark ? '#4338ca' : '#c7d2fe',
            },
          ]}>
          <Ionicons
            name={isOnline ? 'globe-outline' : 'location'}
            size={14}
            color={
              isOnline
                ? isDark ? '#38bdf8' : '#0284c7'
                : isOtherWeek
                  ? theme.textSecondary
                  : isDark ? '#a5b4fc' : '#6366f1'
            }
          />
          <Text
            style={[
              styles.roomText,
              {
                color: isOnline
                  ? isDark ? '#7dd3fc' : '#0369a1'
                  : isOtherWeek
                    ? theme.textSecondary
                    : isDark ? '#c7d2fe' : '#4f46e5',
              },
            ]}
            numberOfLines={1}>
            {isOnline ? 'Zdalnie (online)' : room ? `Sala ${room}` : 'Bez sali'}
          </Text>
        </View>
      </View>

      {/* Meta info row: Prowadzący i grupa */}
      {(Boolean(teacher) || Boolean(block.group || block.cohort)) && (
        <View style={styles.metaContainer}>
          {Boolean(teacher) && (
            <View style={styles.metaRow}>
              <Ionicons
                name="person-outline"
                size={13}
                color={theme.textSecondary}
              />
              <Text
                style={[styles.metaText, { color: theme.textSecondary }]}
                numberOfLines={1}>
                {teacher}
              </Text>
            </View>
          )}

          {Boolean(block.group || block.cohort) && (
            <View style={styles.metaRow}>
              <Ionicons
                name="people-outline"
                size={13}
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
      )}

      {/* Baner kolizji w tej samej godzinie */}
      {hasCollision && (
        <View
          style={[
            styles.collisionBanner,
            {
              backgroundColor: isDark ? '#451a03' : '#fffbeb',
              borderColor: isDark ? '#92400e' : '#fcd34d',
            },
          ]}>
          <Ionicons
            name="warning"
            size={14}
            color={isDark ? '#fbbf24' : '#d97706'}
          />
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.collisionTitle,
                { color: isDark ? '#fde68a' : '#b45309' },
              ]}>
              Kolizja w tej samej godzinie!
            </Text>
            <Text
              style={[
                styles.collisionDesc,
                { color: isDark ? '#fde68a' : '#92400e' },
              ]}>
              Nakłada się z: {collisionInfo.map((c) => `${c.conflictingSubject} (${c.conflictingTime})`).join(', ')}
            </Text>
          </View>
        </View>
      )}
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
  keyInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  durationText: {
    fontSize: 11,
    fontWeight: '500',
  },
  roomBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    maxWidth: '55%',
  },
  roomText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  collisionBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 9,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  collisionTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  collisionDesc: {
    fontSize: 11.5,
    lineHeight: 16,
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
