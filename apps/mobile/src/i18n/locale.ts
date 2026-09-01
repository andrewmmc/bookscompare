import { getLocales } from 'expo-localization';

import type { Locale } from 'expo-localization';

export type SupportedLocale = 'zh-TW' | 'en';
export type LanguagePreference = 'system' | SupportedLocale;

export const DEFAULT_LOCALE: SupportedLocale = 'zh-TW';

const SUPPORTED: readonly SupportedLocale[] = ['zh-TW', 'en'];

function normalizeTag(tag: string | null | undefined): SupportedLocale | null {
  if (!tag) {
    return null;
  }

  const lower = tag.toLowerCase();

  if (lower.startsWith('zh')) {
    return 'zh-TW';
  }

  if (lower.startsWith('en')) {
    return 'en';
  }

  return null;
}

export function resolveSupportedLocale(
  locales: ReadonlyArray<Pick<Locale, 'languageTag' | 'languageCode'>>
): SupportedLocale {
  for (const entry of locales) {
    const match = normalizeTag(entry.languageTag) ?? normalizeTag(entry.languageCode);

    if (match && SUPPORTED.includes(match)) {
      return match;
    }
  }

  return DEFAULT_LOCALE;
}

export function resolveLocale(
  preference: LanguagePreference | undefined,
  locales: ReadonlyArray<Pick<Locale, 'languageTag' | 'languageCode'>>
): SupportedLocale {
  return !preference || preference === 'system' ? resolveSupportedLocale(locales) : preference;
}

export function resolveDeviceLocale(): SupportedLocale {
  try {
    return resolveSupportedLocale(getLocales());
  } catch {
    // expo-localization is unavailable (e.g. tests without the native module).
    return DEFAULT_LOCALE;
  }
}
