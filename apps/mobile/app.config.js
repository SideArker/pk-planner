// The Firebase client configuration is supplied at build time. It is not a server key.
module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    ...(process.env.GOOGLE_SERVICES_JSON
      ? { googleServicesFile: process.env.GOOGLE_SERVICES_JSON }
      : {}),
  },
});
