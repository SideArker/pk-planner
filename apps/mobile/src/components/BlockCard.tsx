import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  type BlockCollisionInfo,
  type ScheduleBlock,
  formatActivityName,
  isBlockActiveNow,
  minutesToTime,
  roomLabel,
  teacherDisplay,
} from '@pk-planner/core';
import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/context/ThemeContext';

interface BlockCardProps {
  block: ScheduleBlock;
  onPress: (block: ScheduleBlock) => void;
  collisionInfo?: BlockCollisionInfo[];
  currentParity?: 'A' | 'B';
  dimWhenNotCurrentWeek?: boolean;
  now?: Date;
}

export function BlockCard({
  block,
  onPress,
  collisionInfo = [],
  currentParity,
  dimWhenNotCurrentWeek = false,
  now,
}: BlockCardProps) {
  const { theme, resolvedTheme } = useAppTheme();
  const isDark = resolvedTheme === 'dark';
  const isOtherWeek = dimWhenNotCurrentWeek && block.teachingWeekParity != null &&
    currentParity != null &&
    !((block.teachingWeekParity === 0 && currentParity === 'A') ||
      (block.teachingWeekParity === 1 && currentParity === 'B'));
  const isCurrent = now != null && isBlockActiveNow(block, now, currentParity);
  const hasCollision = collisionInfo.length > 0;
  const isOnline = block.room?.trim().toUpperCase() === 'ONLINE' ||
    block.campus?.trim().toLowerCase() === 'zdalnie';
  const room = roomLabel(block.room);
  const teacher = teacherDisplay(block);
  const duration = block.duration || 90;
  const startTime = minutesToTime(block.start);
  const endTime = minutesToTime((block.start ?? 0) + duration);
  const minutesLeft = isCurrent && now ? Math.max(1, (block.start ?? 0) + duration -
    (now.getHours() * 60 + now.getMinutes())) : 0;
  const progress = isCurrent ? Math.min(100, Math.max(0, (1 - minutesLeft / duration) * 100)) : 0;
  const parityLabel = block.teachingWeekParity === 0 ? 'Tydzień A' :
    block.teachingWeekParity === 1 ? 'Tydzień B' :
      block.frequency === 'co_2_tygodnie' ? 'Co 2 tyg.' : null;
  const muted = isDark ? '#85858f' : '#64748b';
  const tertiary = isDark ? '#71717a' : '#8492a6';

  return (
    <Pressable
      onPress={() => onPress(block)}
      accessibilityRole="button"
      accessibilityLabel={`${block.subject}, ${startTime}–${endTime}${isCurrent ? ', trwa teraz' : ''}`}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: hasCollision ? '#ef4444' : theme.cardBorder,
          borderWidth: hasCollision ? 1.5 : 1,
          borderLeftColor: isCurrent ? theme.accent : hasCollision ? '#ef4444' : theme.cardBorder,
          borderLeftWidth: isCurrent ? 3 : hasCollision ? 1.5 : 1,
          opacity: pressed ? 0.78 : isOtherWeek ? 0.58 : 1,
        },
      ]}>
      <Text style={[styles.subjectTitle, { color: theme.text }]}>{block.subject}</Text>
      <View style={styles.typeRow}>
        <View style={[styles.typeDot, { backgroundColor: muted }]} />
        <Text style={[styles.typeText, { color: muted }]}>
          {formatActivityName(block.activity) || 'Zajęcia'}
          {parityLabel ? ` · ${parityLabel}` : ''}
          {block.isCustom ? ' · Własne' : ''}
        </Text>
        {isCurrent && (
          <View style={styles.statusRow}>
            <View style={[styles.currentDot, { backgroundColor: theme.accent }]} />
            <Text style={[styles.statusText, { color: theme.accent }]}>Trwa teraz</Text>
          </View>
        )}
        {hasCollision && <Text style={[styles.alertText, { color: '#ef4444', fontWeight: '600' }]}>· Kolizja</Text>}
      </View>
      <View style={styles.detailsRow}>
        <Ionicons name="time-outline" size={15} color={muted} />
        <Text style={[styles.detailsText, { color: theme.text }]}>
          {startTime && endTime ? `${startTime}–${endTime}` : 'Czas n/d'}
        </Text>
        <Text style={[styles.separator, { color: tertiary }]}>·</Text>
        {isOnline ? (
          <View style={[styles.onlineBadge, { backgroundColor: theme.backgroundElement }]}>
            <Text style={[styles.onlineText, { color: muted }]}>Online</Text>
          </View>
        ) : (
          <View style={styles.roomRow}>
            <Ionicons name="location-outline" size={14} color={muted} />
            <Text numberOfLines={1} style={[styles.detailsText, styles.roomText, { color: theme.text }]}>
              {room ? `Sala ${room}` : 'Bez sali'}
            </Text>
          </View>
        )}
      </View>
      {(Boolean(teacher) || Boolean(block.group || block.cohort)) && (
        <Text numberOfLines={1} style={[styles.teacherText, { color: tertiary }]}>
          {teacher || String(block.group || block.cohort)}
        </Text>
      )}
      {isCurrent && (
        <View style={styles.progressRow}>
          <View style={[styles.progressTrack, { backgroundColor: theme.backgroundSelected }]}>
            <View style={[styles.progressFill, { backgroundColor: theme.accent, width: `${progress}%` }]} />
          </View>
          <Text style={[styles.remainingText, { color: muted }]}>{minutesLeft} min</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 8, borderWidth: 1, padding: Spacing.three, marginBottom: 9 },
  subjectTitle: { fontSize: 16, fontWeight: '700', lineHeight: 21, marginBottom: 5 },
  typeRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 5, marginBottom: 10 },
  typeDot: { width: 5, height: 5, borderRadius: 3, marginRight: 2 },
  typeText: { fontSize: 12, fontWeight: '500' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginLeft: 3 },
  currentDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '600' },
  alertText: { fontSize: 12, fontWeight: '500' },
  detailsRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 5 },
  detailsText: { fontSize: 13, fontWeight: '600' },
  separator: { fontSize: 13, marginHorizontal: 2 },
  roomRow: { flexDirection: 'row', alignItems: 'center', gap: 3, flexShrink: 1 },
  roomText: { flexShrink: 1 },
  onlineBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  onlineText: { fontSize: 11, fontWeight: '600' },
  teacherText: { fontSize: 12, marginTop: 9 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 13 },
  progressTrack: { height: 3, flex: 1, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 3 },
  remainingText: { fontSize: 11, fontVariant: ['tabular-nums'] },
});
