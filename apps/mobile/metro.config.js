const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const workspaceRoot = path.resolve(__dirname, '../..');

// Keep Metro's file watcher OUT of Gradle/CMake build output. On Windows the
// watcher crashes when a concurrent Android build churns files under these
// directories (build/, .gradle/, .cxx/, gradle-plugin/**/build). Excluding them
// keeps Metro stable during on-device builds.
const blockList =
  /[\\/](\.gradle|\.cxx)[\\/].*|[\\/]android[\\/](app[\\/])?build[\\/].*|[\\/]gradle-plugin[\\/].*[\\/]build[\\/].*/;

const config = {
  watchFolders: [workspaceRoot],
  resolver: {
    blockList,
    nodeModulesPaths: [
      path.resolve(__dirname, 'node_modules'),
      path.resolve(workspaceRoot, 'node_modules'),
    ],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
