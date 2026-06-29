const pkg = require('./package.json');

const defaultApiBaseUrl = 'http://localhost:8787';
const expoOwner = process.env.EXPO_OWNER || undefined;
const iosBuildNumber = process.env.IOS_BUILD_NUMBER || '1';
const androidVersionCodeRaw = process.env.ANDROID_VERSION_CODE;
const androidVersionCode = androidVersionCodeRaw ? Number(androidVersionCodeRaw) : 1;

/** @param {{ config: import('expo/config').ExpoConfig }} params */
module.exports = ({ config }) => {
  const easProjectId = process.env.EXPO_PROJECT_ID || config.extra?.eas?.projectId || undefined;

  return {
    ...config,
    name: 'BooksCompare',
    slug: 'bookscompare-mobile',
    owner: expoOwner,
    version: pkg.version,
    orientation: 'portrait',
    icon: './assets/icon.png',
    scheme: 'bookscompare',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
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
      buildNumber: iosBuildNumber,
      supportsTablet: false,
      entitlements: {
        'com.apple.developer.ubiquity-kvstore-identifier':
          '$(TeamIdentifierPrefix)$(CFBundleIdentifier)',
      },
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
      versionCode: androidVersionCode,
      adaptiveIcon: {
        foregroundImage: './assets/icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },
    extra: {
      apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? defaultApiBaseUrl,
      posthogKey: process.env.EXPO_PUBLIC_POSTHOG_KEY ?? '',
      posthogHost: process.env.EXPO_PUBLIC_POSTHOG_HOST ?? '',
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
      ...(easProjectId ? { eas: { projectId: easProjectId } } : {}),
    },
    plugins: [
      'expo-font',
      'expo-secure-store',
      'expo-web-browser',
      'expo-apple-authentication',
      [
        'expo-build-properties',
        {
          ios: {
            deploymentTarget: '17.0',
          },
        },
      ],
      [
        'expo-camera',
        {
          cameraPermission: '本應用程式需要使用相機掃描國際標準書號 (ISBN 碼)。',
          recordAudioAndroid: false,
        },
      ],
    ],
  };
};
