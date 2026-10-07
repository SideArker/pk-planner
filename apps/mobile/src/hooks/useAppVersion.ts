import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Application from 'expo-application';
import * as Linking from 'expo-linking';

const VERSION_URL = 'https://pkplanner.sidearker.com/api/version';

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

export function useAppVersion() {
  const installedVersion = Application.nativeApplicationVersion ?? '0.0.0';
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [changelog, setChangelog] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  const checkVersion = useCallback(async () => {
    try {
      const response = await fetch(VERSION_URL);
      if (!response.ok) return;

      const data = (await response.json()) as VersionResponse;
      if (typeof data.version !== 'string') return;

      setLatestVersion(data.version);
      setChangelog(typeof data.changelog === 'string' ? data.changelog.trim() || null : null);
      setDownloadUrl(Platform.OS === 'android' && typeof data.apkUrl === 'string'
        ? data.apkUrl
        : null);
    } catch {
      // Version check is optional; keep app usable when API is unavailable.
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    void checkVersion();
  }, [checkVersion]);

  const updateAvailable =
    latestVersion !== null && compareVersions(latestVersion, installedVersion) > 0;

  const openUpdate = useCallback(async () => {
    if (downloadUrl) await Linking.openURL(downloadUrl);
  }, [downloadUrl]);

  return {
    installedVersion,
    latestVersion,
    updateAvailable,
    downloadUrl,
    changelog,
    isChecking,
    openUpdate,
  };
}
