const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  projectRoot: __dirname,
  watchFolders: [
    // Add the shared package to the watch folders
    path.resolve(__dirname, '../../packages/shared'),
  ],
  resolver: {
    extraNodeModules: {
      // Ensure shared package is properly resolved
      '@entwine-rewrite/shared': path.resolve(__dirname, '../../packages/shared'),
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);