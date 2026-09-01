import commonEn from './locales/en/common.json';
import homeEn from './locales/en/home.json';
import libraryEn from './locales/en/library.json';
import navigationEn from './locales/en/navigation.json';
import searchEn from './locales/en/search.json';
import settingsEn from './locales/en/settings.json';
import commonZhTW from './locales/zh-TW/common.json';
import homeZhTW from './locales/zh-TW/home.json';
import libraryZhTW from './locales/zh-TW/library.json';
import navigationZhTW from './locales/zh-TW/navigation.json';
import searchZhTW from './locales/zh-TW/search.json';
import settingsZhTW from './locales/zh-TW/settings.json';

export const namespaces = [
  'common',
  'navigation',
  'home',
  'search',
  'library',
  'settings',
] as const;

export const resources = {
  en: {
    common: commonEn,
    navigation: navigationEn,
    home: homeEn,
    search: searchEn,
    library: libraryEn,
    settings: settingsEn,
  },
  'zh-TW': {
    common: commonZhTW,
    navigation: navigationZhTW,
    home: homeZhTW,
    search: searchZhTW,
    library: libraryZhTW,
    settings: settingsZhTW,
  },
} as const;

export type TranslationNamespace = (typeof namespaces)[number];
