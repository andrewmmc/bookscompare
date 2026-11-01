import 'react-native-gesture-handler/jestSetup';

import { resetTestWindowSize } from './src/test/windowSize';

// React Native's Jest preset reports a 750pt-wide window; tests default to an iPhone-sized one.
resetTestWindowSize();
afterEach(() => {
  resetTestWindowSize();
});

jest.mock(
  'react-native-safe-area-context',
  () =>
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('react-native-safe-area-context/jest/mock').default
);

jest.mock('react-native-reserved-regions', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  return {
    ReservedRegionsProvider: View,
    ReservedRegionsGate: ({ children }: { children: unknown }) => children,
    useReservedRegions: jest.fn(() => []),
    useReservedRegionsReady: jest.fn(() => true),
  };
});

jest.mock('@expo/vector-icons/Ionicons', () => 'Ionicons');

jest.mock('expo-blur', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  return { BlurView: View };
});

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageTag: 'zh-TW', languageCode: 'zh' }],
  useLocales: () => [{ languageTag: 'zh-TW', languageCode: 'zh' }],
}));

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
