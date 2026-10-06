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
  if (!file) return undefined;

  // Windows paths in the root .env need their WSL mount path when Expo runs in Linux.
  const windowsPath = /^([A-Za-z]):[\\/](.*)$/.exec(file);
  if (process.platform !== 'win32' && windowsPath) {
    const wslPath = path.join('/mnt', windowsPath[1].toLowerCase(), windowsPath[2].replace(/\\/g, '/'));
    if (fs.existsSync(wslPath)) return wslPath;
  }
  return file;
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
