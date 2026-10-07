import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';
import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/context/ThemeContext';
import { useAppUpdate } from '@/context/UpdateContext';

function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export function UpdateModal() {
  const { theme, resolvedTheme } = useAppTheme();
  const isDark = resolvedTheme === 'dark';

  const {
    installedVersion,
    latestVersion,
    changelog,
    isDownloading,
    downloadProgress,
    bytesDownloaded,
    totalBytes,
    downloadError,
    isReadyToInstall,
    isModalVisible,
    closeModal,
    startDownloadAndInstall,
    openInBrowser,
    installDownloadedApk,
  } = useAppUpdate();

  if (!isModalVisible) return null;

  const percent = Math.round(downloadProgress * 100);

  return (
    <Modal
      visible={isModalVisible}
      transparent
      animationType="fade"
      onRequestClose={closeModal}>
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
              <View style={styles.titleRow}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: isDark ? '#1e293b' : '#e0f2fe' },
                  ]}>
                  <Ionicons
                    name="cloud-download-outline"
                    size={22}
                    color={theme.accent}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.title, { color: theme.text }]}>
                    Dostępna aktualizacja
                  </Text>
                  <Text style={[styles.versionSubtitle, { color: theme.textSecondary }]}>
                    Wersja {latestVersion} (aktualna: {installedVersion})
                  </Text>
                </View>
              </View>
            </View>
            {!isDownloading && (
              <Pressable
                accessibilityLabel="Zamknij"
                accessibilityRole="button"
                onPress={closeModal}
                style={({ pressed }) => [
                  styles.closeButton,
                  { opacity: pressed ? 0.6 : 1 },
                ]}>
                <Ionicons name="close" size={20} color={theme.textSecondary} />
              </Pressable>
            )}
          </View>

          {/* Body */}
          <View style={styles.body}>
            {changelog ? (
              <View style={styles.changelogContainer}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Co nowego w tej wersji:
                </Text>
                <ScrollView
                  style={[
                    styles.changelogScroll,
                    {
                      backgroundColor: isDark ? '#09090b' : '#f8fafc',
                      borderColor: theme.border,
                    },
                  ]}
                  contentContainerStyle={styles.changelogContent}
                  nestedScrollEnabled>
                  <Markdown
                    style={{
                      body: { color: theme.textSecondary, fontSize: 13, lineHeight: 20 },
                      heading1: { color: theme.text, fontSize: 16, fontWeight: '700', marginVertical: 4 },
                      heading2: { color: theme.text, fontSize: 14, fontWeight: '600', marginVertical: 4 },
                      paragraph: { marginVertical: 2 },
                      bullet_list: { marginVertical: 4 },
                      list_item: { marginVertical: 2 },
                    }}>
                    {changelog}
                  </Markdown>
                </ScrollView>
              </View>
            ) : (
              <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                Nowa wersja aplikacji zawiera poprawki błędów i usprawnienia działania.
              </Text>
            )}

            {/* Download Progress */}
            {isDownloading && (
              <View style={styles.progressSection}>
                <View style={styles.progressLabelRow}>
                  <Text style={[styles.progressLabel, { color: theme.text }]}>
                    Pobieranie aktualizacji...
                  </Text>
                  <Text style={[styles.progressPercent, { color: theme.accent }]}>
                    {percent}%
                  </Text>
                </View>

                <View
                  style={[
                    styles.progressBarTrack,
                    { backgroundColor: isDark ? '#27272a' : '#e2e8f0' },
                  ]}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        backgroundColor: theme.accent,
                        width: `${Math.max(4, percent)}%`,
                      },
                    ]}
                  />
                </View>

                {totalBytes > 0 && (
                  <Text style={[styles.bytesText, { color: theme.textSecondary }]}>
                    {formatBytes(bytesDownloaded)} / {formatBytes(totalBytes)}
                  </Text>
                )}
              </View>
            )}

            {/* Error Message */}
            {downloadError && (
              <View
                style={[
                  styles.errorBox,
                  {
                    backgroundColor: isDark ? '#450a0a' : '#fef2f2',
                    borderColor: isDark ? '#7f1d1d' : '#fecaca',
                  },
                ]}>
                <Ionicons name="alert-circle-outline" size={18} color="#ef4444" />
                <Text style={styles.errorText}>
                  {downloadError}
                </Text>
              </View>
            )}

            {/* Ready to install notification */}
            {isReadyToInstall && !isDownloading && !downloadError && (
              <View
                style={[
                  styles.successBox,
                  {
                    backgroundColor: isDark ? '#064e3b' : '#f0fdf4',
                    borderColor: isDark ? '#065f46' : '#bbf7d0',
                  },
                ]}>
                <Ionicons name="checkmark-circle-outline" size={18} color="#22c55e" />
                <Text style={[styles.successText, { color: isDark ? '#86efac' : '#15803d' }]}>
                  Pobrano pakiet. Instalator systemowy został uruchomiony.
                </Text>
              </View>
            )}
          </View>

          {/* Footer Actions */}
          <View style={[styles.footer, { borderTopColor: theme.border }]}>
            {isDownloading ? (
              <View style={styles.downloadingRow}>
                <ActivityIndicator size="small" color={theme.accent} />
                <Text style={[styles.downloadingText, { color: theme.textSecondary }]}>
                  Trwa pobieranie...
                </Text>
              </View>
            ) : isReadyToInstall ? (
              <View style={styles.actionButtons}>
                <Pressable
                  accessibilityRole="button"
                  onPress={closeModal}
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    { borderColor: theme.border, opacity: pressed ? 0.7 : 1 },
                  ]}>
                  <Text style={[styles.secondaryButtonText, { color: theme.text }]}>
                    Zamknij
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void installDownloadedApk()}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    { backgroundColor: theme.accent, opacity: pressed ? 0.75 : 1 },
                  ]}>
                  <Text style={styles.primaryButtonText}>
                    Otwórz instalator
                  </Text>
                </Pressable>
              </View>
            ) : downloadError ? (
              <View style={styles.actionButtons}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void openInBrowser()}
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    { borderColor: theme.border, opacity: pressed ? 0.7 : 1 },
                  ]}>
                  <Text style={[styles.secondaryButtonText, { color: theme.text }]}>
                    W przeglądarce
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void startDownloadAndInstall()}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    { backgroundColor: theme.accent, opacity: pressed ? 0.75 : 1 },
                  ]}>
                  <Text style={styles.primaryButtonText}>
                    Spróbuj ponownie
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.actionButtons}>
                <Pressable
                  accessibilityRole="button"
                  onPress={closeModal}
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    { borderColor: theme.border, opacity: pressed ? 0.7 : 1 },
                  ]}>
                  <Text style={[styles.secondaryButtonText, { color: theme.text }]}>
                    Później
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void startDownloadAndInstall()}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    { backgroundColor: theme.accent, opacity: pressed ? 0.75 : 1 },
                  ]}>
                  <Text style={styles.primaryButtonText}>
                    Aktualizuj teraz
                  </Text>
                </Pressable>
              </View>
            )}
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
    padding: Spacing.four,
  },
  modalContent: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '85%',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.four,
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  versionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    padding: 6,
    borderRadius: 8,
  },
  body: {
    padding: Spacing.four,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 19,
  },
  changelogContainer: {
    maxHeight: 220,
  },
  changelogScroll: {
    borderWidth: 1,
    borderRadius: 12,
    maxHeight: 180,
  },
  changelogContent: {
    padding: Spacing.three,
  },
  progressSection: {
    marginTop: 14,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  progressPercent: {
    fontSize: 13,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  bytesText: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'right',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: Spacing.three,
    borderRadius: 10,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    flex: 1,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: Spacing.three,
    borderRadius: 10,
    borderWidth: 1,
  },
  successText: {
    fontSize: 12,
    flex: 1,
  },
  footer: {
    padding: Spacing.four,
    borderTopWidth: 1,
  },
  downloadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  downloadingText: {
    fontSize: 13,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
});
