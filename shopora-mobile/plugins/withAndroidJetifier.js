const { withGradleProperties } = require('@expo/config-plugins');

// tp-react-native-bluetooth-printer depends on the pre-AndroidX
// com.android.support:support-v4, which collides with androidx.core
// ("Duplicate class android.support.v4.app.INotificationSideChannel...").
// Jetifier rewrites old support-library classes to their AndroidX
// equivalents at build time, resolving the collision. Not in gradle.properties
// by default, and gradle.properties isn't committed to git (expo prebuild
// regenerates it), so this has to be injected via a config plugin instead.
module.exports = function withAndroidJetifier(config) {
  return withGradleProperties(config, (config) => {
    config.modResults.push({
      type: 'property',
      key: 'android.enableJetifier',
      value: 'true',
    });
    return config;
  });
};
