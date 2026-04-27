const { getDefaultConfig } = require('expo/metro-config');

// SDK 54 detects pnpm monorepos automatically, so the default Expo config is enough.
module.exports = getDefaultConfig(__dirname);
