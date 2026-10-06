const { withAppBuildGradle } = require('expo/config-plugins');

const signingConfig = `        release {
            if (project.hasProperty('MYAPP_UPLOAD_STORE_FILE')) {
                storeFile file(MYAPP_UPLOAD_STORE_FILE)
                storeType 'PKCS12'
                storePassword MYAPP_UPLOAD_STORE_PASSWORD
                keyAlias MYAPP_UPLOAD_KEY_ALIAS
                keyPassword MYAPP_UPLOAD_KEY_PASSWORD
            }
        }
`;

module.exports = function withAndroidReleaseSigning(config) {
  return withAppBuildGradle(config, (config) => {
    let contents = config.modResults.contents;

    if (!contents.includes("signingConfig signingConfigs.release")) {
      const signingConfigsEnd = '    }\n    buildTypes {';
      if (!contents.includes(signingConfigsEnd)) {
        throw new Error('Could not find Android signingConfigs block');
      }

      contents = contents.replace(signingConfigsEnd, `${signingConfig}    }\n    buildTypes {`);

      const releaseBuildType = /(        release \{[\s\S]*?signingConfig )signingConfigs\.debug/;
      if (!releaseBuildType.test(contents)) {
        throw new Error('Could not find Android release build type');
      }
      contents = contents.replace(releaseBuildType, '$1signingConfigs.release');
    }

    config.modResults.contents = contents;
    return config;
  });
};
