jest.mock('@expo/vector-icons/Ionicons', () => 'Ionicons');

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageTag: 'zh-TW', languageCode: 'zh' }],
}));
