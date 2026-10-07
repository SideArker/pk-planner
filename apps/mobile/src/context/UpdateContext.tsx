import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Platform } from 'react-native';
import * as Application from 'expo-application';
import * as Linking from 'expo-linking';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';

const VERSION_URL = 'https://pkplanner.sidearker.com/api/version';

// Ustaw na true, aby przetestować lokalnie modal, pobieranie APK i instalator bez tworzenia nowej wersji
const MOCK_UPDATE_IN_DEV = true;

interface VersionResponse {
  version?: unknown;
  apkUrl?: unknown;
  changelog?: unknown;
}

function compareVersions(left: string, right: string) {
  const a = left.split('.').map((part) => Number.parseInt(part, 10) || 0);
  const b = right.split('.').map((part) => Number.parseInt(part, 10) || 0);

  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    const difference = (a[index] ?? 0) - (b[index] ?? 0);
    if (difference !== 0) return difference;
  }

  return 0;
}

export interface UpdateContextType {
  installedVersion: string;
  latestVersion: string | null;
  updateAvailable: boolean;
  downloadUrl: string | null;
  changelog: string | null;
  isChecking: boolean;
  isDownloading: boolean;
  downloadProgress: number; // 0 to 1
  bytesDownloaded: number;
  totalBytes: number;
  downloadError: string | null;
  isReadyToInstall: boolean;
  isModalVisible: boolean;
  checkVersion: () => Promise<void>;
  openModal: () => void;
  closeModal: () => void;
  startDownloadAndInstall: () => Promise<void>;
  openInBrowser: () => Promise<void>;
  installDownloadedApk: () => Promise<void>;
}

const UpdateContext = createContext<UpdateContextType | null>(null);

export function UpdateProvider({ children }: { children: React.ReactNode }) {
  const installedVersion = Application.nativeApplicationVersion ?? '0.0.0';
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [changelog, setChangelog] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [bytesDownloaded, setBytesDownloaded] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [isReadyToInstall, setIsReadyToInstall] = useState(false);
  const [downloadedApkUri, setDownloadedApkUri] = useState<string | null>(null);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const hasAutoPromptedRef = useRef(false);
  const downloadTaskRef = useRef<FileSystem.DownloadResumable | null>(null);

  const checkVersion = useCallback(async () => {
    setIsChecking(true);
    try {
      if (__DEV__ && MOCK_UPDATE_IN_DEV) {
        const mockVersion = '9.9.9';
        setLatestVersion(mockVersion);
        setChangelog(
          '## Test aktualizacji lokalnej\n\n' +
          '- Sprawdzenie pobierania natywnego APK z GitHuba\n' +
          '- Wizualizacja postępu pobierania (MB oraz pasek)\n' +
          '- Wywołanie systemowego instalatora Androida'
        );
        setDownloadUrl(
          Platform.OS === 'android'
            ? 'https://github.com/SideArker/pk-planner/releases/download/v1.0.9/app-release.apk'
            : null
        );
        if (compareVersions(mockVersion, installedVersion) > 0 && !hasAutoPromptedRef.current) {
          hasAutoPromptedRef.current = true;
          setIsModalVisible(true);
        }
        return;
      }

      const response = await fetch(VERSION_URL);
      if (!response.ok) return;

      const data = (await response.json()) as VersionResponse;
      if (typeof data.version !== 'string') return;

      const newVersion = data.version;
      setLatestVersion(newVersion);
      setChangelog(typeof data.changelog === 'string' ? data.changelog.trim() || null : null);
      setDownloadUrl(Platform.OS === 'android' && typeof data.apkUrl === 'string' ? data.apkUrl : null);

      if (compareVersions(newVersion, installedVersion) > 0 && !hasAutoPromptedRef.current) {
        hasAutoPromptedRef.current = true;
        setIsModalVisible(true);
      }
    } catch {
      // Version check is optional; keep app usable when API is unavailable.
    } finally {
      setIsChecking(false);
    }
  }, [installedVersion]);

  useEffect(() => {
    void checkVersion();
  }, [checkVersion]);

  const updateAvailable =
    latestVersion !== null && compareVersions(latestVersion, installedVersion) > 0;

  const openInBrowser = useCallback(async () => {
    if (downloadUrl) {
      await Linking.openURL(downloadUrl);
    }
  }, [downloadUrl]);

  const installDownloadedApk = useCallback(async () => {
    if (!downloadedApkUri || Platform.OS !== 'android') return;
    try {
      const contentUri = await FileSystem.getContentUriAsync(downloadedApkUri);
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: contentUri,
        flags: 1, // Intent.FLAG_GRANT_READ_URI_PERMISSION
        type: 'application/vnd.android.package-archive',
      });
    } catch (error) {
      setDownloadError(
        error instanceof Error
          ? `Nie udało się uruchomić instalatora: ${error.message}`
          : 'Nie udało się uruchomić instalatora systemowego.'
      );
    }
  }, [downloadedApkUri]);

  const startDownloadAndInstall = useCallback(async () => {
    if (!downloadUrl) return;

    if (Platform.OS !== 'android') {
      await openInBrowser();
      return;
    }

    setIsDownloading(true);
    setDownloadProgress(0);
    setBytesDownloaded(0);
    setTotalBytes(0);
    setDownloadError(null);
    setIsReadyToInstall(false);

    const filename = `pk-planner-${latestVersion || 'update'}.apk`;
    const targetUri = `${FileSystem.cacheDirectory}${filename}`;

    try {
      const fileInfo = await FileSystem.getInfoAsync(targetUri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(targetUri, { idempotent: true });
      }

      const resumable = FileSystem.createDownloadResumable(
        downloadUrl,
        targetUri,
        {},
        (progress) => {
          const total = progress.totalBytesExpectedToWrite;
          const written = progress.totalBytesWritten;
          setBytesDownloaded(written);
          setTotalBytes(total);
          if (total > 0) {
            setDownloadProgress(Math.min(1, Math.max(0, written / total)));
          }
        }
      );

      downloadTaskRef.current = resumable;
      const downloadResult = await resumable.downloadAsync();
      downloadTaskRef.current = null;

      if (!downloadResult?.uri) {
        throw new Error('Pobieranie pliku nie powiodło się.');
      }

      setDownloadedApkUri(downloadResult.uri);
      setIsReadyToInstall(true);
      setIsDownloading(false);

      const contentUri = await FileSystem.getContentUriAsync(downloadResult.uri);
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: contentUri,
        flags: 1, // Intent.FLAG_GRANT_READ_URI_PERMISSION
        type: 'application/vnd.android.package-archive',
      });
    } catch (error) {
      setIsDownloading(false);
      downloadTaskRef.current = null;
      setDownloadError(
        error instanceof Error ? error.message : 'Wystąpił nieoczekiwany błąd podczas pobierania aktualizacji.'
      );
    }
  }, [downloadUrl, latestVersion, openInBrowser]);

  const openModal = useCallback(() => {
    setIsModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    // If download is ongoing, keep it in background or let user close dialog
    setIsModalVisible(false);
  }, []);

  return (
    <UpdateContext.Provider
      value={{
        installedVersion,
        latestVersion,
        updateAvailable,
        downloadUrl,
        changelog,
        isChecking,
        isDownloading,
        downloadProgress,
        bytesDownloaded,
        totalBytes,
        downloadError,
        isReadyToInstall,
        isModalVisible,
        checkVersion,
        openModal,
        closeModal,
        startDownloadAndInstall,
        openInBrowser,
        installDownloadedApk,
      }}>
      {children}
    </UpdateContext.Provider>
  );
}

export function useAppUpdate(): UpdateContextType {
  const context = useContext(UpdateContext);
  if (!context) {
    throw new Error('useAppUpdate must be used within an UpdateProvider');
  }
  return context;
}
