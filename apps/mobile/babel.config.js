module.exports = {
  presets: ['module:@react-native/babel-preset'],
  // Must be listed last. Reanimated 4 uses the Worklets plugin (replaces the
  // legacy react-native-reanimated/plugin).
  plugins: ['react-native-worklets/plugin'],
};
