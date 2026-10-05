import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig, loadEnv } from "vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const rootDir = path.resolve(import.meta.dirname, "../../");
  const env = loadEnv(mode, rootDir, "");

  let proxyTarget = "https://pk-planner.rsowa126.workers.dev";
  if (env.WORKER_URL) {
    proxyTarget = env.WORKER_URL;
  } else if (env.VITE_API_URL && env.VITE_API_URL.startsWith("http")) {
    try {
      proxyTarget = new URL(env.VITE_API_URL).origin;
    } catch {
      // fallback
    }
  }

  return {
    envDir: rootDir,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
      },
    },
    server: {
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  };
});

