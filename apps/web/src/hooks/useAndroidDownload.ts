import { useEffect, useState } from "react";

interface VersionResponse {
  apkUrl?: unknown;
}

export function useAndroidDownload() {
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/version", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Version HTTP ${response.status}`);
        return response.json() as Promise<VersionResponse>;
      })
      .then((data) => {
        if (typeof data.apkUrl !== "string") return;
        const url = new URL(data.apkUrl);
        if (url.protocol === "https:") setDownloadUrl(url.href);
      })
      .catch(() => {
        // The download link is optional when the version API or APK is unavailable.
      });

    return () => controller.abort();
  }, []);

  return downloadUrl;
}
