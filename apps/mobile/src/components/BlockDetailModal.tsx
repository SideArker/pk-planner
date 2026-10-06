import React, { useEffect, useState } from 'react';
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
  type BlockCollisionInfo,
  type BlockOverride,
  type ScheduleBlock,
  type ScheduleState,
  DAY_INFO,
  findAlternativeGroups,
  formatActivityName,
  minutesToTime,
  roomLabel,
  teacherDisplay,
} from '@pk-planner/core';
import { getActivityStyle, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/context/ThemeContext';

interface BlockDetailModalProps {
  block: ScheduleBlock | null;
  state: ScheduleState | null;
  isOpen: boolean;
  onClose: () => void;
  onSwitchGroup: (subject: string, activity: string, chosenOptionId: string) => void;
  onSaveOverride: (blockId: string, override: BlockOverride) => void;
  onRemoveCustomBlock?: (blockId: string) => void;
  collisionInfo?: BlockCollisionInfo[];
}

export function BlockDetailModal({
  block,
  state,
  isOpen,
  onClose,
  onSwitchGroup,
  onSaveOverride,
  onRemoveCustomBlock,
  collisionInfo,
}: BlockDetailModalProps) {
  const { theme, resolvedTheme } = useAppTheme();
  const isDark = resolvedTheme === 'dark';

  const [activeTab, setActiveTab] = useState<'details' | 'switchGroup' | 'custom'>('details');
  const [customSubject, setCustomSubject] = useState('');
  const [customTeacher, setCustomTeacher] = useState('');
  const [customRoom, setCustomRoom] = useState('');
  const [customNotes, setCustomNotes] = useState('');

  useEffect(() => {
    if (block) {
      setCustomSubject(block.subject || '');
      setCustomTeacher(teacherDisplay(block) || '');
      setCustomRoom(block.room || '');
      setCustomNotes(block.notes || '');
      setActiveTab('details');
    }
  }, [block]);

  if (!isOpen || !block) return null;

  const actStyle = getActivityStyle(block.activity, resolvedTheme);
  const startTime = minutesToTime(block.start);
  const endTime = minutesToTime((block.start ?? 0) + (block.duration || 90));
  const teacher = teacherDisplay(block);
  const room = roomLabel(block.room);
  const isCustomBlock = Boolean(block.isCustom || block.id.startsWith('custom-'));
  const alternativeGroups = state ? findAlternativeGroups(state, block) : [];

  const handleSaveCustom = () => {
    onSaveOverride(block.id, {
      customSubject: customSubject.trim() || undefined,
      customTeacher: customTeacher.trim() || undefined,
      customRoom: customRoom.trim() || undefined,
      customNotes: customNotes.trim() || undefined,
    });
    onClose();
  };

  const isOnline =
    block.room?.trim().toUpperCase() === 'ONLINE' ||
    block.campus?.trim().toLowerCase() === 'zdalnie';

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
            <View style={{ flex: 1, paddingRight: 8 }}>
              <View style={styles.badgeRow}>
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: actStyle.badgeBg },
                  ]}>
                  <Text style={[styles.badgeText, { color: actStyle.badgeText }]}>
                    {formatActivityName(block.activity) || 'Zajęcia'}
                  </Text>
                </View>

                {isCustomBlock && (
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: isDark ? '#451a03' : '#fef3c7' },
                    ]}>
                    <Text
                      style={[
                        styles.badgeText,
                        { color: isDark ? '#fde68a' : '#b45309' },
                      ]}>
                      Własne
                    </Text>
                  </View>
                )}

                {block.teachingWeekParity != null && (
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: isDark ? '#27272a' : '#f1f5f9' },
                    ]}>
                    <Text
                      style={[
                        styles.badgeText,
                        { color: isDark ? '#d4d4d8' : '#475569' },
                      ]}>
                      {block.teachingWeekParity === 0 ? 'Tydzień A' : 'Tydzień B'}
                    </Text>
                  </View>
                )}
              </View>

              <Text
                style={[styles.subjectTitle, { color: theme.text }]}
                numberOfLines={2}>
                {block.subject}
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

          {/* Tab Selector */}
          <View
            style={[
              styles.tabBar,
              {
                backgroundColor: isDark ? '#09090b' : '#f8fafc',
                borderBottomColor: theme.border,
              },
            ]}>
            <Pressable
              onPress={() => setActiveTab('details')}
              style={[
                styles.tabBtn,
                activeTab === 'details' && [
                  styles.tabBtnActive,
                  { borderBottomColor: theme.accent },
                ],
              ]}>
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color:
                      activeTab === 'details'
                        ? theme.accent
                        : theme.textSecondary,
                    fontWeight: activeTab === 'details' ? '700' : '500',
                  },
                ]}>
                Szczegóły
              </Text>
            </Pressable>

            {!isCustomBlock && alternativeGroups.length > 0 && (
              <Pressable
                onPress={() => setActiveTab('switchGroup')}
                style={[
                  styles.tabBtn,
                  activeTab === 'switchGroup' && [
                    styles.tabBtnActive,
                    { borderBottomColor: theme.accent },
                  ],
                ]}>
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color:
                        activeTab === 'switchGroup'
                          ? theme.accent
                          : theme.textSecondary,
                      fontWeight: activeTab === 'switchGroup' ? '700' : '500',
                    },
                  ]}>
                  Zmień grupę ({alternativeGroups.length})
                </Text>
              </Pressable>
            )}

            <Pressable
              onPress={() => setActiveTab('custom')}
              style={[
                styles.tabBtn,
                activeTab === 'custom' && [
                  styles.tabBtnActive,
                  { borderBottomColor: theme.accent },
                ],
              ]}>
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color:
                      activeTab === 'custom'
                        ? theme.accent
                        : theme.textSecondary,
                    fontWeight: activeTab === 'custom' ? '700' : '500',
                  },
                ]}>
                Dostosuj
              </Text>
            </Pressable>
          </View>

          {/* Tab Content */}
          <ScrollView
            style={styles.contentScroll}
            contentContainerStyle={styles.contentBody}>
            {activeTab === 'details' && (
              <View style={styles.detailsList}>
                {Boolean(collisionInfo && collisionInfo.length > 0) && (
                  <View
                    style={[
                      styles.collisionNotice,
                      {
                        backgroundColor: isDark ? '#451a03' : '#fffbeb',
                        borderColor: isDark ? '#92400e' : '#fcd34d',
                      },
                    ]}>
                    <Ionicons
                      name="warning"
                      size={20}
                      color={isDark ? '#fbbf24' : '#d97706'}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.collisionNoticeTitle,
                          { color: isDark ? '#fde68a' : '#b45309' },
                        ]}>
                        Wykryto kolizję w tej samej godzinie!
                      </Text>
                      <Text
                        style={[
                          styles.collisionNoticeText,
                          { color: isDark ? '#fde68a' : '#92400e' },
                        ]}>
                        Te zajęcia nakładają się z: {collisionInfo!.map((c) => `${c.conflictingSubject} (${c.conflictingTime})`).join(', ')}.
                      </Text>
                      {!isCustomBlock && alternativeGroups.length > 0 && (
                        <Pressable
                          onPress={() => setActiveTab('switchGroup')}
                          style={({ pressed }) => [
                            styles.collisionActionBtn,
                            { opacity: pressed ? 0.8 : 1 },
                          ]}>
                          <Text style={styles.collisionActionBtnText}>
                            Zmień grupę, aby rozwiązać kolizję →
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                )}

                {/* Time & Day */}
                <View style={styles.detailItem}>
                  <Ionicons name="time-outline" size={18} color={theme.textSecondary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                      Termin
                    </Text>
                    <Text style={[styles.detailValue, { color: theme.text }]}>
                      {block.day && DAY_INFO[block.day] ? DAY_INFO[block.day][1] : block.day},{' '}
                      {startTime} – {endTime} ({block.duration || 90} min)
                    </Text>
                  </View>
                </View>

                {/* Room */}
                <View style={styles.detailItem}>
                  <Ionicons
                    name="location-outline"
                    size={18}
                    color={isOnline ? '#0ea5e9' : theme.textSecondary}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                      Sala
                    </Text>
                    <Text
                      style={[
                        styles.detailValue,
                        { color: isOnline ? '#0ea5e9' : theme.text, fontWeight: isOnline ? '700' : '500' },
                      ]}>
                      {isOnline ? 'Zdalnie (online)' : room ? `Sala ${room}` : 'Brak sali'}
                    </Text>
                  </View>
                </View>

                {/* Teacher */}
                {Boolean(teacher) && (
                  <View style={styles.detailItem}>
                    <Ionicons name="person-outline" size={18} color={theme.textSecondary} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                        Prowadzący
                      </Text>
                      <Text style={[styles.detailValue, { color: theme.text }]}>
                        {teacher}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Cohort / Group */}
                {Boolean(block.group || block.cohort) && (
                  <View style={styles.detailItem}>
                    <Ionicons name="people-outline" size={18} color={theme.textSecondary} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                        Grupa / Rocznik
                      </Text>
                      <Text style={[styles.detailValue, { color: theme.text }]}>
                        {String(block.group || block.cohort || '')}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Notes */}
                {Boolean(block.notes) && (
                  <View style={styles.detailItem}>
                    <Ionicons name="document-text-outline" size={18} color={theme.textSecondary} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                        Notatki
                      </Text>
                      <Text style={[styles.detailValue, { color: theme.text }]}>
                        {block.notes}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Delete button if custom block */}
                {isCustomBlock && onRemoveCustomBlock && (
                  <Pressable
                    onPress={() => {
                      onRemoveCustomBlock(block.id);
                      onClose();
                    }}
                    style={({ pressed }) => [
                      styles.deleteBtn,
                      {
                        backgroundColor: isDark ? '#450a0a' : '#fee2e2',
                        borderColor: theme.destructive,
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}>
                    <Ionicons name="trash-outline" size={18} color={theme.destructive} />
                    <Text style={[styles.deleteBtnText, { color: theme.destructive }]}>
                      Usuń te własne zajęcia
                    </Text>
                  </Pressable>
                )}
              </View>
            )}

            {activeTab === 'switchGroup' && (
              <View style={styles.switchList}>
                <Text style={[styles.switchHeader, { color: theme.textSecondary }]}>
                  Wybierz inną grupę dla tych zajęć:
                </Text>

                {alternativeGroups.map((alt) => {
                  const altStart = minutesToTime(alt.start);
                  const altEnd = minutesToTime((alt.start ?? 0) + (alt.duration || 90));
                  const altRoom = roomLabel(alt.room);
                  const isCurrent = alt.id === block.id;

                  return (
                    <Pressable
                      key={alt.id}
                      onPress={() => {
                        onSwitchGroup(block.subject, block.activity || '', alt.id);
                        onClose();
                      }}
                      style={({ pressed }) => [
                        styles.groupOption,
                        {
                          backgroundColor: isCurrent
                            ? isDark
                              ? '#27272a'
                              : '#f1f5f9'
                            : isDark
                              ? '#18181b'
                              : '#ffffff',
                          borderColor: isCurrent
                            ? theme.accent
                            : theme.border,
                          opacity: pressed ? 0.8 : 1,
                        },
                      ]}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.groupOptionTitle, { color: theme.text }]}>
                          {alt.group || alt.cohort || 'Grupa'}
                        </Text>
                        <Text style={[styles.groupOptionMeta, { color: theme.textSecondary }]}>
                          {alt.day && DAY_INFO[alt.day] ? DAY_INFO[alt.day][0] : alt.day}{' '}
                          {altStart}–{altEnd} · {altRoom ? `s. ${altRoom}` : 'Zdalnie'}
                        </Text>
                        {Boolean(alt.teacher) && (
                          <Text style={[styles.groupOptionTeacher, { color: theme.textSecondary }]}>
                            {alt.teacher}
                          </Text>
                        )}
                      </View>

                      {isCurrent ? (
                        <View style={styles.currentGroupTag}>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: theme.accent }}>
                            Wybrana
                          </Text>
                        </View>
                      ) : (
                        <Ionicons name="swap-horizontal" size={18} color={theme.accent} />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            )}

            {activeTab === 'custom' && (
              <View style={styles.customForm}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  Własna nazwa przedmiotu
                </Text>
                <TextInput
                  value={customSubject}
                  onChangeText={setCustomSubject}
                  placeholder={block.subject}
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

                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  Prowadzący
                </Text>
                <TextInput
                  value={customTeacher}
                  onChangeText={setCustomTeacher}
                  placeholder={teacher || 'dr Jan Kowalski'}
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

                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  Sala
                </Text>
                <TextInput
                  value={customRoom}
                  onChangeText={setCustomRoom}
                  placeholder={room || 'np. D21'}
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

                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  Własne notatki
                </Text>
                <TextInput
                  value={customNotes}
                  onChangeText={setCustomNotes}
                  placeholder="Dodatkowe informacje..."
                  placeholderTextColor={theme.textSecondary}
                  multiline
                  style={[
                    styles.input,
                    styles.textArea,
                    {
                      backgroundColor: isDark ? '#27272a' : '#f8fafc',
                      color: theme.text,
                      borderColor: theme.border,
                    },
                  ]}
                />

                <Pressable
                  onPress={handleSaveCustom}
                  style={({ pressed }) => [
                    styles.saveBtn,
                    {
                      backgroundColor: isDark ? '#fafafa' : '#18181b',
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.saveBtnText,
                      { color: isDark ? '#09090b' : '#ffffff' },
                    ]}>
                    Zapisz zmiany
                  </Text>
                </Pressable>
              </View>
            )}
          </ScrollView>
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
    maxWidth: 480,
    maxHeight: '85%',
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: Spacing.four,
    borderBottomWidth: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  subjectTitle: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: Spacing.three,
  },
  tabBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {},
  tabLabel: {
    fontSize: 13,
  },
  contentScroll: {
    flexGrow: 1,
  },
  contentBody: {
    padding: Spacing.four,
  },
  detailsList: {
    gap: 14,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  detailLabel: {
    fontSize: 11,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  detailValue: {
    fontSize: 14,
    lineHeight: 19,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 10,
  },
  deleteBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  switchList: {
    gap: 10,
  },
  switchHeader: {
    fontSize: 12,
    marginBottom: 4,
  },
  groupOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  groupOptionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  groupOptionMeta: {
    fontSize: 12,
  },
  groupOptionTeacher: {
    fontSize: 11.5,
    marginTop: 2,
  },
  currentGroupTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  customForm: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  saveBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  collisionNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  collisionNoticeTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    marginBottom: 2,
  },
  collisionNoticeText: {
    fontSize: 12,
    lineHeight: 17,
  },
  collisionActionBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#d97706',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  collisionActionBtnText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '700',
  },
});
