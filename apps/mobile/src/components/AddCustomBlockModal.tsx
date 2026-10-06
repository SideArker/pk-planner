import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  type Day,
  type PlanType,
  type ScheduleBlock,
  availableDays,
  DAY_INFO,
  minutesToTime,
  timeToMinutes,
} from '@pk-planner/core';
import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/context/ThemeContext';

interface AddCustomBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBlock: (block: Partial<ScheduleBlock> & { subject: string; planType: PlanType }) => void;
  planType: PlanType;
  defaultDay?: Day;
}

const ACTIVITY_OPTIONS = [
  { value: 'W', label: 'Wykład' },
  { value: 'Ć', label: 'Ćwiczenia' },
  { value: 'L', label: 'Laboratorium' },
  { value: 'P', label: 'Projekt' },
  { value: 'S', label: 'Seminarium' },
  { value: 'Lektorat', label: 'Lektorat' },
  { value: 'WF', label: 'WF' },
  { value: 'Inne', label: 'Inne' },
];

const STANDARD_PK_SLOTS = [
  { index: 1, start: 450, duration: 90, label: '07:30 - 09:00 (Blok 1)' },
  { index: 2, start: 555, duration: 90, label: '09:15 - 10:45 (Blok 2)' },
  { index: 3, start: 660, duration: 90, label: '11:00 - 12:30 (Blok 3)' },
  { index: 4, start: 765, duration: 90, label: '12:45 - 14:15 (Blok 4)' },
  { index: 5, start: 870, duration: 90, label: '14:30 - 16:00 (Blok 5)' },
  { index: 6, start: 975, duration: 90, label: '16:15 - 17:45 (Blok 6)' },
  { index: 7, start: 1080, duration: 90, label: '18:00 - 19:30 (Blok 7)' },
  { index: 8, start: 1185, duration: 90, label: '19:45 - 21:15 (Blok 8)' },
];

export function AddCustomBlockModal({
  isOpen,
  onClose,
  onAddBlock,
  planType,
  defaultDay = 'MON',
}: AddCustomBlockModalProps) {
  const { theme, resolvedTheme } = useAppTheme();
  const isDark = resolvedTheme === 'dark';

  const days: Day[] = availableDays(planType);

  const [subject, setSubject] = useState('');
  const [activity, setActivity] = useState('Ć');
  const [day, setDay] = useState<Day>(days.includes(defaultDay) ? defaultDay : (days[0] || 'MON'));
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(2);
  const [customStartTime, setCustomStartTime] = useState('09:15');
  const [duration, setDuration] = useState(90);
  const [parity, setParity] = useState<'all' | 'A' | 'B'>('all');
  const [room, setRoom] = useState('');
  const [teacher, setTeacher] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectSlot = (slot: typeof STANDARD_PK_SLOTS[number]) => {
    setSelectedSlotIndex(slot.index);
    setCustomStartTime(minutesToTime(slot.start));
    setDuration(slot.duration);
  };

  const handleCustomTimeChange = (val: string) => {
    setCustomStartTime(val);
    setSelectedSlotIndex(null);
  };

  const handleSubmit = () => {
    if (!subject.trim()) {
      setError('Podaj nazwę zajęć lub przedmiotu.');
      return;
    }

    const startMinutes = timeToMinutes(customStartTime);
    if (startMinutes == null) {
      setError('Podaj poprawną godzinę rozpoczęcia (np. 09:15).');
      return;
    }

    const teachingWeekParity = parity === 'A' ? 0 : parity === 'B' ? 1 : null;

    onAddBlock({
      subject: subject.trim(),
      activity: activity.trim(),
      day,
      start: startMinutes,
      duration: Number(duration) || 90,
      room: room.trim() || undefined,
      teacher: teacher.trim() || undefined,
      notes: notes.trim() || undefined,
      frequency: parity === 'all' ? 'co_tydzien' : 'co_2_tygodnie',
      teachingWeekParity,
      planType,
    });

    // Reset state & close
    setSubject('');
    setError(null);
    onClose();
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: isDark ? '#18181b' : '#ffffff',
              borderColor: theme.border,
            },
          ]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <View>
              <Text style={[styles.headerTitle, { color: theme.text }]}>
                Dodaj własne zajęcia
              </Text>
              <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                Uzupełnij swój plan o dodatkowe przedmioty lub konsultacje
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                {
                  backgroundColor: isDark ? '#27272a' : '#f1f5f9',
                  opacity: pressed ? 0.7 : 1,
                },
              ]}>
              <Ionicons name="close" size={20} color={theme.text} />
            </Pressable>
          </View>

          {/* Form Scroll */}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.formContainer}>
            {error && (
              <View
                style={[
                  styles.errorBanner,
                  {
                    backgroundColor: isDark ? '#450a0a' : '#fee2e2',
                    borderColor: theme.destructive,
                  },
                ]}>
                <Ionicons name="alert-circle" size={16} color={theme.destructive} />
                <Text style={[styles.errorText, { color: theme.destructive }]}>
                  {error}
                </Text>
              </View>
            )}

            {/* Subject */}
            <Text style={[styles.label, { color: theme.text }]}>
              Nazwa zajęć / przedmiotu *
            </Text>
            <TextInput
              value={subject}
              onChangeText={(t) => {
                setSubject(t);
                setError(null);
              }}
              placeholder="np. Seminarium dyplomowe, Koło naukowe"
              placeholderTextColor={theme.textSecondary}
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? '#27272a' : '#f8fafc',
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
            />

            {/* Activity Type Chips */}
            <Text style={[styles.label, { color: theme.text }]}>Typ zajęć</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
              <View style={styles.chipsRow}>
                {ACTIVITY_OPTIONS.map((opt) => {
                  const isSelected = activity === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => setActivity(opt.value)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isSelected
                            ? isDark
                              ? '#fafafa'
                              : '#18181b'
                            : isDark
                              ? '#27272a'
                              : '#f1f5f9',
                          borderColor: isSelected
                            ? isDark
                              ? '#fafafa'
                              : '#18181b'
                            : theme.border,
                        },
                      ]}>
                      <Text
                        style={[
                          styles.chipText,
                          {
                            color: isSelected
                              ? isDark
                                ? '#09090b'
                                : '#ffffff'
                              : theme.text,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>

            {/* Day */}
            <Text style={[styles.label, { color: theme.text }]}>Dzień tygodnia</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
              <View style={styles.chipsRow}>
                {days.map((d) => {
                  const isSelected = day === d;
                  const label = DAY_INFO[d]?.[0] || d;
                  return (
                    <Pressable
                      key={d}
                      onPress={() => setDay(d)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isSelected
                            ? isDark
                              ? '#fafafa'
                              : '#18181b'
                            : isDark
                              ? '#27272a'
                              : '#f1f5f9',
                          borderColor: isSelected
                            ? isDark
                              ? '#fafafa'
                              : '#18181b'
                            : theme.border,
                        },
                      ]}>
                      <Text
                        style={[
                          styles.chipText,
                          {
                            color: isSelected
                              ? isDark
                                ? '#09090b'
                                : '#ffffff'
                              : theme.text,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}>
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>

            {/* Standard PK Slots */}
            <Text style={[styles.label, { color: theme.text }]}>
              Standardowe bloki PK
            </Text>
            <View style={styles.slotsGrid}>
              {STANDARD_PK_SLOTS.map((s) => {
                const isSelected = selectedSlotIndex === s.index;
                return (
                  <Pressable
                    key={s.index}
                    onPress={() => handleSelectSlot(s)}
                    style={[
                      styles.slotBtn,
                      {
                        backgroundColor: isSelected
                          ? isDark
                            ? '#27272a'
                            : '#f1f5f9'
                          : isDark
                            ? '#18181b'
                            : '#ffffff',
                        borderColor: isSelected
                          ? theme.accent
                          : theme.border,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.slotBtnText,
                        {
                          color: isSelected ? theme.accent : theme.text,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}>
                      {s.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Custom Time & Duration */}
            <View style={styles.twoCol}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: theme.text }]}>
                  Godzina startu
                </Text>
                <TextInput
                  value={customStartTime}
                  onChangeText={handleCustomTimeChange}
                  placeholder="09:15"
                  placeholderTextColor={theme.textSecondary}
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#27272a' : '#f8fafc',
                      color: theme.text,
                      borderColor: theme.border,
                    },
                  ]}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: theme.text }]}>
                  Czas trwania (min)
                </Text>
                <TextInput
                  value={String(duration)}
                  onChangeText={(val) => setDuration(Number(val) || 90)}
                  keyboardType="numeric"
                  placeholder="90"
                  placeholderTextColor={theme.textSecondary}
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#27272a' : '#f8fafc',
                      color: theme.text,
                      borderColor: theme.border,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Parity */}
            <Text style={[styles.label, { color: theme.text }]}>Powtarzalność</Text>
            <View style={styles.parityRow}>
              {[
                { id: 'all', label: 'Co tydzień' },
                { id: 'A', label: 'Tylko tydz. A' },
                { id: 'B', label: 'Tylko tydz. B' },
              ].map((p) => {
                const isSelected = parity === p.id;
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => setParity(p.id as any)}
                    style={[
                      styles.parityBtn,
                      {
                        backgroundColor: isSelected
                          ? isDark
                            ? '#fafafa'
                            : '#18181b'
                          : isDark
                            ? '#27272a'
                            : '#f1f5f9',
                        borderColor: isSelected
                          ? isDark
                            ? '#fafafa'
                            : '#18181b'
                          : theme.border,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.parityBtnText,
                        {
                          color: isSelected
                            ? isDark
                              ? '#09090b'
                              : '#ffffff'
                            : theme.text,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}>
                      {p.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Room & Teacher */}
            <View style={styles.twoCol}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: theme.text }]}>Sala</Text>
                <TextInput
                  value={room}
                  onChangeText={setRoom}
                  placeholder="np. D21 / Zdalnie"
                  placeholderTextColor={theme.textSecondary}
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#27272a' : '#f8fafc',
                      color: theme.text,
                      borderColor: theme.border,
                    },
                  ]}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: theme.text }]}>Prowadzący</Text>
                <TextInput
                  value={teacher}
                  onChangeText={setTeacher}
                  placeholder="np. dr inż. Jan..."
                  placeholderTextColor={theme.textSecondary}
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#27272a' : '#f8fafc',
                      color: theme.text,
                      borderColor: theme.border,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Notes */}
            <Text style={[styles.label, { color: theme.text }]}>Notatka</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Dodatkowe informacje..."
              placeholderTextColor={theme.textSecondary}
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? '#27272a' : '#f8fafc',
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
            />
          </ScrollView>

          {/* Footer Submit Button */}
          <View style={[styles.footer, { borderTopColor: theme.border }]}>
            <Pressable
              onPress={handleSubmit}
              style={({ pressed }) => [
                styles.submitBtn,
                {
                  backgroundColor: isDark ? '#fafafa' : '#18181b',
                  opacity: pressed ? 0.8 : 1,
                },
              ]}>
              <Ionicons
                name="add-circle"
                size={18}
                color={isDark ? '#09090b' : '#ffffff'}
              />
              <Text
                style={[
                  styles.submitBtnText,
                  { color: isDark ? '#09090b' : '#ffffff' },
                ]}>
                Dodaj do mojego planu
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.three,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flexGrow: 1,
  },
  formContainer: {
    padding: Spacing.three,
    gap: 7,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 4,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13.5,
  },
  chipsScroll: {
    marginVertical: 2,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 4,
  },
  slotBtn: {
    width: '48%',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  slotBtnText: {
    fontSize: 11,
  },
  twoCol: {
    flexDirection: 'row',
    gap: 8,
  },
  parityRow: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: 2,
  },
  parityBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  parityBtnText: {
    fontSize: 11.5,
  },
  footer: {
    padding: Spacing.three,
    borderTopWidth: 1,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
