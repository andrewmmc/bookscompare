import { useLocales } from 'expo-localization';
import { useEffect } from 'react';

import { usePreferences } from '../lib/preferences';
import { i18n } from './index';
import { resolveLocale } from './locale';

import type { ReactNode } from 'react';

interface LanguageControllerProps {
  children: ReactNode;
}

export function LanguageController({ children }: LanguageControllerProps) {
  const locales = useLocales();
  const { languagePreference } = usePreferences();
  const locale = resolveLocale(languagePreference, locales);

  useEffect(() => {
    if (i18n.resolvedLanguage !== locale) {
      void i18n.changeLanguage(locale);
    }
  }, [locale]);

  return children;
}
