const fs = require('node:fs');
const path = require('node:path');

// Expo resolves config from apps/mobile, while local development keeps .env at the repo root.
function googleServicesPath() {
  if (process.env.GOOGLE_SERVICES_JSON) return process.env.GOOGLE_SERVICES_JSON;
  const envFile = path.resolve(__dirname, '../../.env');
  if (!fs.existsSync(envFile)) return undefined;
  const match = fs.readFileSync(envFile, 'utf8').match(/^GOOGLE_SERVICES_JSON=(.*)$/m);
  return match?.[1]?.trim().replace(/^['"]|['"]$/g, '') || undefined;
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
