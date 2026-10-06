import React, { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Switch,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { resolveUserBlocks, type PlanType } from '@pk-planner/core';

import { AddCustomBlockModal } from '@/components/AddCustomBlockModal';
import { OnboardingModal } from '@/components/OnboardingModal';
import { Spacing } from '@/constants/theme';
import { ThemeMode, useAppTheme } from '@/context/ThemeContext';
import { useScheduleData } from '@/hooks/useScheduleData';
import { useUserSchedule } from '@/hooks/useUserSchedule';
import { useAppVersion } from '@/hooks/useAppVersion';
import {
  loadNotificationPreferences,
  saveNotificationPreferences,
  syncNotifications,
  type NotificationPreferences,
} from '@/utils/notifications';

export default function SettingsScreen() {
  const { theme, resolvedTheme, mode, setThemeMode } = useAppTheme();
  const isDark = resolvedTheme === 'dark';

  const { state, refresh, isLoading, lastUpdated } = useScheduleData();
  const { installedVersion, latestVersion, updateAvailable, downloadUrl, isChecking, openUpdate } = useAppVersion();
  const {
    config,
    saveAllConfig,
    addCustomBlock,
    removeCustomBlock,
    resetConfig,
  } = useUserSchedule();

  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isAddCustomOpen, setIsAddCustomOpen] = useState(false);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>({
    reminders: false,
    countdown: false,
    scheduleUpdates: false,
  });
  const [notificationsReady, setNotificationsReady] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<string | null>(null);

  useEffect(() => {
    void loadNotificationPreferences().then((value) => {
      setNotificationPreferences(value);
      setNotificationsReady(true);
    });
  }, []);

  const updateNotifications = async (next: NotificationPreferences) => {
    setNotificationPreferences(next);
    await saveNotificationPreferences(next);
    if (!state) return;
    try {
      const result = await syncNotifications(resolveUserBlocks(state, config), next);
      setNotificationStatus(result === 'permission-denied'
        ? 'Włącz powiadomienia w ustawieniach telefonu.'
        : result === 'fcm'
          ? 'Aktywne przez FCM.'
          : result === 'local'
            ? 'Aktywne lokalnie na urządzeniu.'
            : null);
    } catch {
      setNotificationStatus('Nie udało się skonfigurować powiadomień. Spróbuj ponownie.');
    }
  };

  const handleSaveOnboarding = (
    cohort: string,
    planType: PlanType,
    selectedSubjects: Record<string, boolean>,
    selectedGroups: Record<string, string>,
  ) => {
    saveAllConfig(cohort, planType, selectedSubjects, selectedGroups);
    setIsOnboardingOpen(false);
  };

  const handleReset = () => {
    Alert.alert(
      'Zresetować konfigurację?',
      'Spowoduje to usunięcie zapisanego rocznika, wyborów grup oraz własnych zajęć.',
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Zresetuj',
          style: 'destructive',
          onPress: () => resetConfig(),
        },
      ],
    );
  };

  const THEME_OPTIONS: { id: ThemeMode; label: string; icon: any }[] = [
    { id: 'system', label: 'Systemowy', icon: 'phone-portrait-outline' },
    { id: 'light', label: 'Jasny', icon: 'sunny-outline' },
    { id: 'dark', label: 'Ciemny', icon: 'moon-outline' },
  ];

  return (
    <SafeAreaView
      edges={['top']}
      style={[
        styles.safeArea,
        { backgroundColor: isDark ? '#09090b' : '#f8fafc' },
      ]}>
      {/* Top Title Bar */}
      <View
        style={[
          styles.headerBar,
          {
            backgroundColor: isDark ? '#09090b' : '#ffffff',
            borderBottomColor: theme.border,
          },
        ]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Ustawienia</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Section 1: Active Schedule */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            TWÓJ PLAN ZAJĘĆ
          </Text>

          <View
            style={[
              styles.card,
              {
                backgroundColor: isDark ? '#18181b' : '#ffffff',
                borderColor: theme.border,
              },
            ]}>
            <View style={styles.rowBetween}>
              <View>
                <Text style={[styles.cardHeading, { color: theme.text }]}>
                  {config.cohort || 'Brak wybranego rocznika'}
                </Text>
                <Text style={[styles.cardSubheading, { color: theme.textSecondary }]}>
                  Studia {config.planType === 'niestacjonarne' ? 'niestacjonarne' : 'stacjonarne'}
                </Text>
              </View>

              {Boolean(config.cohort) && (
                <View
                  style={[
                    styles.activeBadge,
                    { backgroundColor: isDark ? '#064e3b' : '#d1fae5' },
                  ]}>
                  <Text style={[styles.activeBadgeText, { color: isDark ? '#6ee7b7' : '#047857' }]}>
                    Aktywny
                  </Text>
                </View>
              )}
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={styles.buttonCol}>
              <Pressable
                onPress={() => setIsOnboardingOpen(true)}
                style={({ pressed }) => [
                  styles.menuBtn,
                  {
                    backgroundColor: isDark ? '#27272a' : '#f1f5f9',
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}>
                <Ionicons name="school-outline" size={18} color={theme.text} />
                <Text style={[styles.menuBtnText, { color: theme.text }]}>
                  Zmień kierunek i rocznik
                </Text>
                <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
              </Pressable>

              <Pressable
                onPress={() => setIsOnboardingOpen(true)}
                style={({ pressed }) => [
                  styles.menuBtn,
                  {
                    backgroundColor: isDark ? '#27272a' : '#f1f5f9',
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}>
                <Ionicons name="options-outline" size={18} color={theme.text} />
                <Text style={[styles.menuBtnText, { color: theme.text }]}>
                  Dostosuj grupy ćwiczeniowe / lab
                </Text>
                <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Section 2: Appearance & Theme */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            MOTYW I WYGLĄD
          </Text>

          <View
            style={[
              styles.card,
              {
                backgroundColor: isDark ? '#18181b' : '#ffffff',
                borderColor: theme.border,
              },
            ]}>
            <View style={styles.themeRow}>
              {THEME_OPTIONS.map((opt) => {
                const isSelected = mode === opt.id;
                return (
                  <Pressable
                    key={opt.id}
                    onPress={() => setThemeMode(opt.id)}
                    style={({ pressed }) => [
                      styles.themeOption,
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
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}>
                    <Ionicons
                      name={opt.icon}
                      size={20}
                      color={
                        isSelected
                          ? isDark
                            ? '#09090b'
                            : '#ffffff'
                          : theme.text
                      }
                    />
                    <Text
                      style={[
                        styles.themeOptionLabel,
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
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>POWIADOMIENIA</Text>
          <View style={[styles.card, { backgroundColor: isDark ? '#18181b' : '#ffffff', borderColor: theme.border }]}>
          <View style={styles.notificationRow}>
              <View style={styles.notificationText}>
                <Text style={[styles.cardHeading, { color: theme.text }]}>Przypomnienia</Text>
                <Text style={[styles.cardSubheading, { color: theme.textSecondary }]}>
                  30 minut przed zajęciami i przy ich rozpoczęciu.
                </Text>
              </View>
              <Switch
                accessibilityLabel="Przypomnienia o zajęciach"
                disabled={!notificationsReady}
                value={notificationPreferences.reminders}
                onValueChange={(reminders) => void updateNotifications({ ...notificationPreferences, reminders })}
              />
            </View>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <View style={styles.notificationRow}>
              <View style={styles.notificationText}>
                <Text style={[styles.cardHeading, { color: theme.text }]}>Odliczanie zajęć</Text>
                <Text style={[styles.cardSubheading, { color: theme.textSecondary }]}>
                  Czas do końca zajęć. Na Androidzie aktualizowany co 5 minut przez FCM.
                </Text>
              </View>
              <Switch
                accessibilityLabel="Odliczanie zajęć"
                disabled={!notificationsReady}
                value={notificationPreferences.countdown}
                onValueChange={(countdown) => void updateNotifications({ ...notificationPreferences, countdown })}
              />
            </View>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <View style={styles.notificationRow}>
              <View style={styles.notificationText}>
                <Text style={[styles.cardHeading, { color: theme.text }]}>Zmiany w planie</Text>
                <Text style={[styles.cardSubheading, { color: theme.textSecondary }]}>Powiadomienie push na Androidzie, gdy opublikowany plan zajęć się zmieni.</Text>
              </View>
              <Switch
                accessibilityLabel="Powiadomienia o zmianach planu"
                disabled={!notificationsReady}
                value={notificationPreferences.scheduleUpdates}
                onValueChange={(scheduleUpdates) => void updateNotifications({ ...notificationPreferences, scheduleUpdates })}
              />
            </View>
            {notificationStatus && (
              <Text style={[styles.cardSubheading, { color: theme.textSecondary }]}>{notificationStatus}</Text>
            )}
          </View>
        </View>

        {/* Section 3: Custom Blocks */}
        <View style={styles.section}>
          <View style={styles.rowBetween}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              WŁASNE ZAJĘCIA ({(config.customBlocks || []).length})
            </Text>
            <Pressable
              onPress={() => setIsAddCustomOpen(true)}
              style={({ pressed }) => [
                styles.addCustomLink,
                { opacity: pressed ? 0.7 : 1 },
              ]}>
              <Ionicons name="add" size={16} color={theme.accent} />
              <Text style={[styles.addCustomLinkText, { color: theme.accent }]}>
                Dodaj
              </Text>
            </Pressable>
          </View>

          <View
            style={[
              styles.card,
              {
                backgroundColor: isDark ? '#18181b' : '#ffffff',
                borderColor: theme.border,
              },
            ]}>
            {(config.customBlocks || []).length === 0 ? (
              <Text style={[styles.emptyCustomText, { color: theme.textSecondary }]}>
                Brak dodanych własnych zajęć.
              </Text>
            ) : (
              <View style={styles.customList}>
                {(config.customBlocks || []).map((cb) => (
                  <View
                    key={cb.id}
                    style={[
                      styles.customItemRow,
                      { borderBottomColor: theme.border },
                    ]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.customItemTitle, { color: theme.text }]}>
                        {cb.subject}
                      </Text>
                      <Text
                        style={[
                          styles.customItemMeta,
                          { color: theme.textSecondary },
                        ]}>
                        {cb.day} · {cb.activity} · {cb.room || 'Brak sali'}
                      </Text>
                    </View>

                    <Pressable
                      onPress={() => removeCustomBlock(cb.id)}
                      style={({ pressed }) => [
                        styles.trashBtn,
                        { opacity: pressed ? 0.6 : 1 },
                      ]}>
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color={theme.destructive}
                      />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Section 4: Data & Sync */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            DANE I SYNCHRONIZACJA
          </Text>

          <View
            style={[
              styles.card,
              {
                backgroundColor: isDark ? '#18181b' : '#ffffff',
                borderColor: theme.border,
              },
            ]}>
            {Boolean(lastUpdated) && (
              <View style={styles.syncRow}>
                <Text style={[styles.syncLabel, { color: theme.textSecondary }]}>
                  Ostatnia aktualizacja:
                </Text>
                <Text style={[styles.syncValue, { color: theme.text }]}>
                  {lastUpdated}
                </Text>
              </View>
            )}

            <Pressable
              onPress={() => refresh()}
              disabled={isLoading}
              style={({ pressed }) => [
                styles.syncBtn,
                {
                  backgroundColor: isDark ? '#27272a' : '#f1f5f9',
                  opacity: pressed ? 0.7 : 1,
                },
              ]}>
              <Ionicons
                name="reload"
                size={16}
                color={theme.text}
              />
              <Text style={[styles.syncBtnText, { color: theme.text }]}>
                {isLoading ? 'Pobieranie...' : 'Wymuś odświeżenie danych'}
              </Text>
            </Pressable>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <Pressable
              onPress={handleReset}
              style={({ pressed }) => [
                styles.resetBtn,
                {
                  backgroundColor: isDark ? '#450a0a' : '#fee2e2',
                  borderColor: theme.destructive,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}>
              <Ionicons
                name="warning-outline"
                size={16}
                color={theme.destructive}
              />
              <Text style={[styles.resetBtnText, { color: theme.destructive }]}>
                Zresetuj konfigurację planu
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>AKTUALIZACJA APLIKACJI</Text>
          <View style={[styles.card, { backgroundColor: isDark ? '#18181b' : '#ffffff', borderColor: theme.border }]}>
            <View style={styles.rowBetween}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardHeading, { color: theme.text }]}>
                  {updateAvailable ? `Dostępna wersja ${latestVersion}` : `Wersja ${installedVersion}`}
                </Text>
                <Text style={[styles.cardSubheading, { color: theme.textSecondary }]}>
                  {updateAvailable
                    ? downloadUrl
                      ? 'Pobierz najnowszą wersję aplikacji.'
                      : 'Nowa wersja jest dostępna. Link do pobrania nie został skonfigurowany.'
                    : isChecking
                      ? 'Sprawdzanie aktualizacji...'
                      : latestVersion
                        ? 'Masz najnowszą wersję.'
                        : 'Nie udało się sprawdzić wersji.'}
                </Text>
              </View>
              {updateAvailable && downloadUrl && (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void openUpdate()}
                  style={({ pressed }) => [styles.updateButton, { backgroundColor: theme.accent, opacity: pressed ? 0.75 : 1 }]}>
                  <Text style={styles.updateButtonText}>Zaktualizuj</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>

        {/* App Footer */}
        <View style={styles.footerContainer}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
            PK Planner · Mobilna wersja SideArker
          </Text>
        </View>
      </ScrollView>

      {/* Onboarding Modal */}
      <OnboardingModal
        state={state}
        isOpen={isOnboardingOpen}
        initialCohort={config.cohort}
        initialPlanType={config.planType}
        initialSelectedSubjects={config.selectedSubjects}
        initialSelectedGroups={config.selectedGroups}
        onSave={handleSaveOnboarding}
        onClose={() => setIsOnboardingOpen(false)}
        isClosable={true}
      />

      {/* Add Custom Block Modal */}
      <AddCustomBlockModal
        isOpen={isAddCustomOpen}
        onClose={() => setIsAddCustomOpen(false)}
        onAddBlock={addCustomBlock}
        planType={config.planType}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerBar: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  scrollContent: {
    padding: Spacing.three,
    gap: 18,
    paddingBottom: 40,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeading: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardSubheading: {
    fontSize: 12.5,
    marginTop: 2,
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  buttonCol: {
    gap: 8,
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationText: {
    flex: 1,
  },
  menuBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    gap: 10,
  },
  menuBtnText: {
    fontSize: 13.5,
    fontWeight: '600',
    flex: 1,
  },
  updateButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 9,
    marginLeft: 12,
  },
  updateButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  themeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  themeOptionLabel: {
    fontSize: 12,
  },
  addCustomLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  addCustomLinkText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  emptyCustomText: {
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 12,
  },
  customList: {
    gap: 4,
  },
  customItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  customItemTitle: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  customItemMeta: {
    fontSize: 11.5,
    marginTop: 2,
  },
  trashBtn: {
    padding: 8,
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  syncLabel: {
    fontSize: 12.5,
  },
  syncValue: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 10,
  },
  syncBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  resetBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  footerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
  },
  footerText: {
    fontSize: 11.5,
  },
});
