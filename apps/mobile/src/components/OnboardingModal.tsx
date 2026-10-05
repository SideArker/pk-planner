import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  buildSubjectCatalog,
  detectIsPairedCohort,
  exerciseGroupForLab,
  getCohortHierarchy,
  prefillScheduleSelections,
  DAY_INFO,
  formatActivityName,
  minutesToTime,
  roomLabel,
  NOT_APPLICABLE_VALUE,
  type CohortHierarchyNode,
  type Degree,
  type FieldOfStudy,
  type PlanType,
  type ScheduleState,
} from '@pk-planner/core';
import { getActivityStyle, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/context/ThemeContext';

interface OnboardingModalProps {
  state: ScheduleState | null;
  isOpen: boolean;
  initialCohort?: string;
  initialPlanType?: PlanType;
  initialSelectedSubjects?: Record<string, boolean>;
  initialSelectedGroups?: Record<string, string>;
  onSave: (
    cohort: string,
    planType: PlanType,
    selectedSubjects: Record<string, boolean>,
    selectedGroups: Record<string, string>,
  ) => void;
  onClose?: () => void;
  isClosable?: boolean;
}

export function OnboardingModal({
  state,
  isOpen,
  initialCohort = '',
  initialPlanType = 'stacjonarne',
  initialSelectedSubjects = {},
  initialSelectedGroups = {},
  onSave,
  onClose,
  isClosable = false,
}: OnboardingModalProps) {
  const { theme, resolvedTheme } = useAppTheme();
  const isDark = resolvedTheme === 'dark';

  const [step, setStep] = useState<1 | 2>(initialCohort ? 2 : 1);
  const [selectedField, setSelectedField] = useState<FieldOfStudy>('Informatyka');
  const [selectedDegree, setSelectedDegree] = useState<Degree>('I stopień');
  const [selectedYear, setSelectedYear] = useState<number>(1);
  const [selectedCohort, setSelectedCohort] = useState(initialCohort);
  const [selectedPlanType, setSelectedPlanType] = useState<PlanType>(initialPlanType);

  const [selectedSubjects, setSelectedSubjects] = useState<Record<string, boolean>>(
    initialSelectedSubjects,
  );
  const [selectedGroups, setSelectedGroups] = useState<Record<string, string>>(
    initialSelectedGroups,
  );

  const hierarchy = useMemo(() => {
    if (!state) {
      return {
        fields: {
          Informatyka: { 'I stopień': {}, 'II stopień': {} },
          Cyberpsychologia: { 'I stopień': {}, 'II stopień': {} },
        },
        allNodes: [],
      };
    }
    return getCohortHierarchy(state);
  }, [state]);

  const availableYears = useMemo(() => {
    const yearsMap = hierarchy.fields[selectedField]?.[selectedDegree] || {};
    return Object.keys(yearsMap)
      .map(Number)
      .sort((a, b) => a - b);
  }, [hierarchy, selectedField, selectedDegree]);

  const currentCohorts = useMemo(() => {
    const yearsMap = hierarchy.fields[selectedField]?.[selectedDegree] || {};
    return yearsMap[selectedYear] || [];
  }, [hierarchy, selectedField, selectedDegree, selectedYear]);

  const subjectCatalog = useMemo(() => {
    if (!state || !selectedCohort) return [];
    return buildSubjectCatalog(state, selectedCohort);
  }, [state, selectedCohort]);

  const isPairedCohort = useMemo(
    () => detectIsPairedCohort(subjectCatalog),
    [subjectCatalog],
  );

  if (!isOpen) return null;

  const handleSelectCohortNode = (node: CohortHierarchyNode) => {
    setSelectedCohort(node.value);
    setSelectedPlanType(node.planType);

    if (state) {
      const baseToUse = node.cohortBase || node.value;
      const catalog = buildSubjectCatalog(state, baseToUse);
      const { selectedSubjects: subs, selectedGroups: grps } = prefillScheduleSelections(
        catalog,
        node.groupNumber,
      );
      setSelectedSubjects(subs);
      setSelectedGroups(grps);
    }

    setStep(2);
  };

  const toggleSubject = (subjectName: string) => {
    setSelectedSubjects((prev) => ({
      ...prev,
      [subjectName]: prev[subjectName] === false,
    }));
  };

  const setGroupForActivity = (subjectName: string, activity: string, optionId: string) => {
    const key = `${subjectName}:${activity}`;
    setSelectedGroups((prev) => {
      const next = { ...prev, [key]: optionId };

      if (isPairedCohort && ['l', 'lab'].includes(activity.toLowerCase())) {
        const catalogItem = subjectCatalog.find((s) => s.subject === subjectName);
        const labAct = catalogItem?.activities.find((a) => a.activity === activity);
        const chosenOpt = labAct?.options.find((o) => o.id === optionId);

        if (chosenOpt) {
          const match = chosenOpt.group?.match(/(\d+)/);
          const labNum = match ? Number(match[1]) : null;
          if (labNum !== null) {
            const exNum = exerciseGroupForLab(chosenOpt.cohort || selectedCohort, labNum);
            const exAct = catalogItem?.activities.find((a) =>
              ['c', 'cw', 'cwiczenia', 'ćw'].includes(a.activity.toLowerCase()),
            );
            if (exAct) {
              const matchingExOpt = exAct.options.find((o) => {
                const exMatch = o.group?.match(/(\d+)/);
                return exMatch ? Number(exMatch[1]) === exNum : false;
              });
              if (matchingExOpt) {
                next[`${subjectName}:${exAct.activity}`] = matchingExOpt.id;
              }
            }
          }
        }
      }
      return next;
    });
  };

  const handleFinish = () => {
    onSave(selectedCohort, selectedPlanType, selectedSubjects, selectedGroups);
    if (onClose) onClose();
  };

  const fields = Object.keys(hierarchy.fields) as FieldOfStudy[];
  const degrees: Degree[] = ['I stopień', 'II stopień'];

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={isClosable ? onClose : undefined}>
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
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, { color: theme.text }]}>
                {step === 1 ? 'Wybierz swój kierunek' : 'Dostosuj przedmioty'}
              </Text>
              <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                {step === 1
                  ? 'Krok 1 z 2: Wybierz rocznik, semestr i grupę'
                  : `Krok 2 z 2: ${selectedCohort}`}
              </Text>
            </View>

            {isClosable && onClose && (
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [
                  styles.closeBtn,
                  {
                    backgroundColor: isDark ? '#27272a' : '#f1f5f9',
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}>
                <Ionicons name="close" size={20} color={theme.text} />
              </Pressable>
            )}
          </View>

          {/* Body */}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.bodyContainer}>
            {step === 1 ? (
              <View style={styles.stepContainer}>
                {/* Field Selection */}
                <Text style={[styles.sectionLabel, { color: theme.text }]}>Kierunek studiów</Text>
                <View style={styles.chipsRow}>
                  {fields.map((f) => {
                    const isSelected = selectedField === f;
                    return (
                      <Pressable
                        key={f}
                        onPress={() => setSelectedField(f)}
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
                          {f}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Degree Selection */}
                <Text style={[styles.sectionLabel, { color: theme.text }]}>Stopień studiów</Text>
                <View style={styles.chipsRow}>
                  {degrees.map((d) => {
                    const isSelected = selectedDegree === d;
                    return (
                      <Pressable
                        key={d}
                        onPress={() => setSelectedDegree(d)}
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
                          {d}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Year Selection */}
                {availableYears.length > 0 && (
                  <>
                    <Text style={[styles.sectionLabel, { color: theme.text }]}>Rok studiów</Text>
                    <View style={styles.chipsRow}>
                      {availableYears.map((yr) => {
                        const isSelected = selectedYear === yr;
                        return (
                          <Pressable
                            key={yr}
                            onPress={() => setSelectedYear(yr)}
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
                              Rok {yr}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </>
                )}

                {/* Cohorts / Groups List */}
                <Text style={[styles.sectionLabel, { color: theme.text }]}>
                  Wybierz grupę / rocznik:
                </Text>
                <View style={styles.cohortsGrid}>
                  {currentCohorts.map((node) => {
                    const isSelected = selectedCohort === node.value;
                    return (
                      <Pressable
                        key={node.value}
                        onPress={() => handleSelectCohortNode(node)}
                        style={({ pressed }) => [
                          styles.cohortCard,
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
                            opacity: pressed ? 0.8 : 1,
                          },
                        ]}>
                        <Text
                          style={[
                            styles.cohortCardTitle,
                            { color: isSelected ? theme.accent : theme.text },
                          ]}>
                          {node.label}
                        </Text>
                        <Text style={[styles.cohortCardMeta, { color: theme.textSecondary }]}>
                          {node.planType === 'stacjonarne' ? 'Stacjonarne' : 'Niestacjonarne'}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : (
              <View style={styles.stepContainer}>
                {/* Subject List */}
                {subjectCatalog.map((subj) => {
                  const isChecked = selectedSubjects[subj.subject] !== false;

                  return (
                    <View
                      key={subj.subject}
                      style={[
                        styles.subjectCard,
                        {
                          backgroundColor: isDark ? '#18181b' : '#ffffff',
                          borderColor: theme.border,
                          opacity: isChecked ? 1 : 0.6,
                        },
                      ]}>
                      {/* Subject Toggle Row */}
                      <Pressable
                        onPress={() => toggleSubject(subj.subject)}
                        style={styles.subjectCardHeader}>
                        <Ionicons
                          name={isChecked ? 'checkbox' : 'square-outline'}
                          size={22}
                          color={isChecked ? theme.accent : theme.textSecondary}
                        />
                        <Text
                          style={[
                            styles.subjectName,
                            {
                              color: theme.text,
                              textDecorationLine: isChecked ? 'none' : 'line-through',
                            },
                          ]}>
                          {subj.subject}
                        </Text>
                      </Pressable>

                      {/* Activities / Groups if enabled */}
                      {isChecked && (
                        <View style={styles.activitiesContainer}>
                          {subj.activities.map((act) => {
                            const actStyle = getActivityStyle(act.activity, resolvedTheme);
                            const key = `${subj.subject}:${act.activity}`;
                            const chosenOptId = selectedGroups[key] || act.options[0]?.id;

                            return (
                              <View key={act.activity} style={styles.activityBlock}>
                                <View style={styles.activityLabelRow}>
                                  <View
                                    style={[
                                      styles.actBadge,
                                      { backgroundColor: actStyle.badgeBg },
                                    ]}>
                                    <Text
                                      style={[
                                        styles.actBadgeText,
                                        { color: actStyle.badgeText },
                                      ]}>
                                      {formatActivityName(act.activity)}
                                    </Text>
                                  </View>
                                </View>

                                {/* Options chips */}
                                <ScrollView
                                  horizontal
                                  showsHorizontalScrollIndicator={false}
                                  style={{ marginTop: 4 }}>
                                  <View style={styles.chipsRow}>
                                    {act.options.map((opt) => {
                                      const isChosen = chosenOptId === opt.id;
                                      const timeStr =
                                        opt.start != null
                                          ? `${minutesToTime(opt.start)}-${minutesToTime(opt.start + (opt.duration || 90))}`
                                          : '';
                                      const dayStr = opt.day && DAY_INFO[opt.day] ? DAY_INFO[opt.day][0] : opt.day || '';
                                      const roomStr = opt.room ? `s. ${roomLabel(opt.room)}` : '';
                                      const label = opt.group || opt.teacher || 'Domyślna';

                                      return (
                                        <Pressable
                                          key={opt.id}
                                          onPress={() =>
                                            setGroupForActivity(subj.subject, act.activity, opt.id)
                                          }
                                          style={[
                                            styles.optChip,
                                            {
                                              backgroundColor: isChosen
                                                ? isDark
                                                  ? '#fafafa'
                                                  : '#18181b'
                                                : isDark
                                                  ? '#27272a'
                                                  : '#f1f5f9',
                                              borderColor: isChosen
                                                ? isDark
                                                  ? '#fafafa'
                                                  : '#18181b'
                                                : theme.border,
                                            },
                                          ]}>
                                          <Text
                                            style={[
                                              styles.optChipText,
                                              {
                                                color: isChosen
                                                  ? isDark
                                                    ? '#09090b'
                                                    : '#ffffff'
                                                  : theme.text,
                                                fontWeight: isChosen ? '700' : '500',
                                              },
                                            ]}>
                                            {label}
                                          </Text>
                                          {Boolean(timeStr) && (
                                            <Text
                                              style={[
                                                styles.optChipSub,
                                                {
                                                  color: isChosen
                                                    ? isDark
                                                      ? '#3f3f46'
                                                      : '#e4e4e7'
                                                    : theme.textSecondary,
                                                },
                                              ]}>
                                              {dayStr} {timeStr} {roomStr}
                                            </Text>
                                          )}
                                        </Pressable>
                                      );
                                    })}
                                  </View>
                                </ScrollView>
                              </View>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>

          {/* Footer Navigation */}
          <View style={[styles.footer, { borderTopColor: theme.border }]}>
            {step === 2 && (
              <Pressable
                onPress={() => setStep(1)}
                style={({ pressed }) => [
                  styles.backBtn,
                  {
                    backgroundColor: isDark ? '#27272a' : '#f1f5f9',
                    borderColor: theme.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}>
                <Ionicons name="arrow-back" size={16} color={theme.text} />
                <Text style={[styles.backBtnText, { color: theme.text }]}>Wstecz</Text>
              </Pressable>
            )}

            <Pressable
              onPress={step === 1 ? () => setStep(2) : handleFinish}
              disabled={step === 1 && !selectedCohort}
              style={({ pressed }) => [
                styles.finishBtn,
                {
                  backgroundColor: isDark ? '#fafafa' : '#18181b',
                  opacity: pressed || (step === 1 && !selectedCohort) ? 0.7 : 1,
                },
              ]}>
              <Text
                style={[
                  styles.finishBtnText,
                  { color: isDark ? '#09090b' : '#ffffff' },
                ]}>
                {step === 1 ? 'Dalej' : 'Zapisz i pokaż plan'}
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
    maxWidth: 520,
    maxHeight: '92%',
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
    fontSize: 11.5,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flexGrow: 1,
  },
  bodyContainer: {
    padding: Spacing.three,
  },
  stepContainer: {
    gap: 12,
  },
  sectionLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    marginTop: 6,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
  },
  cohortsGrid: {
    gap: 8,
  },
  cohortCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  cohortCardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  cohortCardMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  subjectCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  subjectCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subjectName: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  activitiesContainer: {
    gap: 8,
    paddingLeft: 28,
  },
  activityBlock: {
    gap: 4,
  },
  activityLabelRow: {
    flexDirection: 'row',
  },
  actBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  actBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  optChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  optChipText: {
    fontSize: 11.5,
  },
  optChipSub: {
    fontSize: 9.5,
    marginTop: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: Spacing.three,
    borderTopWidth: 1,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  finishBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  finishBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
