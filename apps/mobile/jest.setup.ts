jest.mock('@expo/vector-icons/Ionicons', () => 'Ionicons');

jest.mock('expo-blur', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  return { BlurView: View };
});

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageTag: 'zh-TW', languageCode: 'zh' }],
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
