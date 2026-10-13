const path = require('node:path');

module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['<rootDir>/jest.setup.ts'],
  transform: {
    // Apply this app's Babel config to @lamma/shared too (it lives outside apps/mobile).
    '^.+\.(js|jsx|ts|tsx)$': ['babel-jest', { configFile: path.join(__dirname, 'babel.config.js') }],
    '^.+\.(bmp|gif|jpg|jpeg|mp4|png|psd|svg|webp|ttf)$': require.resolve(
      '@react-native/jest-preset/jest/assetFileTransformer.js',
    ),
  },
  moduleNameMapper: {
    // @lamma/shared lives outside this app; resolve its Babel helpers from the app's own node_modules.
    '^@babel/runtime/(.*)$': '<rootDir>/node_modules/@babel/runtime/$1',
    '^lucide-react-native/icons/(.*)$': '<rootDir>/node_modules/lucide-react-native/dist/cjs/icons/$1.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native|@react-navigation|@lamma|lucide-react-native|react-native-mmkv|react-native-nitro-modules|react-native-svg|react-native-screens|react-native-safe-area-context|react-native-keychain|react-native-restart)/)',
  ],
};
