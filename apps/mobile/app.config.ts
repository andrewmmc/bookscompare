import type { ExpoConfig, ConfigContext } from 'expo/config';

import pkg from './package.json';

const defaultApiBaseUrl = 'https://bookscompare-api.andrewmmc.workers.dev';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'BooksCompare',
  slug: 'bookscompare-mobile',
  version: pkg.version,
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'bookscompare',
  userInterfaceStyle: 'light',
  newArchEnabled: true,
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#f5efe5',
  },
  runtimeVersion: {
    policy: 'appVersion',
  },
  updates: {
    enabled: false,
  },
  experiments: {
    autolinkingModuleResolution: true,
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    bundleIdentifier: 'com.andrewmmc.BookPriceApp',
    supportsTablet: false,
    infoPlist: {
      CFBundleDevelopmentRegion: 'zh_Hant_TW',
      ITSAppUsesNonExemptEncryption: false,
      NSCameraUsageDescription: '本應用程式需要使用相機掃描國際標準書號 (ISBN 碼)。',
    },
    privacyManifests: {
      NSPrivacyTracking: false,
      NSPrivacyTrackingDomains: [],
      NSPrivacyCollectedDataTypes: [],
      NSPrivacyAccessedAPITypes: [
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryFileTimestamp',
          NSPrivacyAccessedAPITypeReasons: ['C617.1'],
        },
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategorySystemBootTime',
          NSPrivacyAccessedAPITypeReasons: ['35F9.1'],
        },
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryDiskSpace',
          NSPrivacyAccessedAPITypeReasons: ['E174.1'],
        },
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults',
          NSPrivacyAccessedAPITypeReasons: ['CA92.1'],
        },
      ],
    },
  },
  android: {
    package: 'com.andrewmmc.BookPriceApp',
    adaptiveIcon: {
      foregroundImage: './assets/icon.png',
      backgroundColor: '#f5efe5',
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },
  extra: {
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? defaultApiBaseUrl,
    posthogKey: process.env.EXPO_PUBLIC_POSTHOG_KEY ?? '',
  },
  plugins: [
    [
      'expo-camera',
      {
        cameraPermission: '本應用程式需要使用相機掃描國際標準書號 (ISBN 碼)。',
        recordAudioAndroid: false,
      },
    ],
  ],
});
