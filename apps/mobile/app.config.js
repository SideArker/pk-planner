const fs = require('node:fs');
const path = require('node:path');

// Expo resolves config from apps/mobile, while local development keeps .env at the repo root.
function googleServicesPath() {
  let file = process.env.GOOGLE_SERVICES_JSON;
  const envFile = path.resolve(__dirname, '../../.env');
  if (!file && fs.existsSync(envFile)) {
    const match = fs.readFileSync(envFile, 'utf8').match(/^GOOGLE_SERVICES_JSON=(.*)$/m);
    file = match?.[1]?.trim().replace(/^['"]|['"]$/g, '') || undefined;
  }
  // Keep the standard local file path available for developers who don't use
  // the root .env path override. This file is gitignored and supplied to EAS
  // as a secret file environment variable for cloud builds.
  if (!file) {
    const localFile = path.join(__dirname, 'google-services.json');
    if (fs.existsSync(localFile)) file = localFile;
  }
  if (!file) return undefined;

  // Windows paths in the root .env need their WSL mount path when Expo runs in Linux.
  const windowsPath = /^([A-Za-z]):[\\/](.*)$/.exec(file);
  if (process.platform !== 'win32' && windowsPath) {
    const wslPath = path.join('/mnt', windowsPath[1].toLowerCase(), windowsPath[2].replace(/\\/g, '/'));
    if (fs.existsSync(wslPath)) return wslPath;
  }
  return path.isAbsolute(file) ? file : path.resolve(__dirname, file);
}

module.exports = ({ config }) => {
  const file = googleServicesPath();
  return {
    ...config,
    android: {
      ...config.android,
      ...(file ? { googleServicesFile: file } : {}),
    },
  };
};
