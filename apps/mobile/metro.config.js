const path = require('node:path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const projectRoot = __dirname;
const sharedRoot = path.resolve(projectRoot, '../../packages/shared');
const defaults = getDefaultConfig(projectRoot);

module.exports = mergeConfig(defaults, {
  watchFolders: [sharedRoot],
  resolver: {
    nodeModulesPaths: [path.resolve(projectRoot, 'node_modules')],
    sourceExts: [...new Set([...defaults.resolver.sourceExts, 'mjs', 'cjs'])],
  },
});
