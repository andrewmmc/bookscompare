import { getLocales } from 'expo-localization';

export type SupportedLocale = 'zh-TW' | 'en';

export const DEFAULT_LOCALE: SupportedLocale = 'zh-TW';

const SUPPORTED: readonly SupportedLocale[] = ['zh-TW'];

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

export function resolveDeviceLocale(): SupportedLocale {
  try {
    const locales = getLocales();

    for (const entry of locales) {
      const match = normalizeTag(entry.languageTag) ?? normalizeTag(entry.languageCode);

      if (match && SUPPORTED.includes(match)) {
        return match;
      }
    }
  } catch {
    // expo-localization is unavailable (e.g. tests without the native module).
  }

  return DEFAULT_LOCALE;
}
