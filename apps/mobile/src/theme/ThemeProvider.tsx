import { createContext, useContext, useEffect, useMemo } from 'react';
import { Appearance, useColorScheme } from 'react-native';

import { usePreferences } from '../lib/preferences';
import { darkColors, lightColors } from './colors';

import type { ReactNode } from 'react';
import type { ThemeColors } from './colors';

export type ThemeScheme = 'light' | 'dark';

interface ThemeContextValue {
  colors: ThemeColors;
  scheme: ThemeScheme;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: lightColors,
  scheme: 'light',
});

interface ThemeProviderProps {
  children: ReactNode;
  schemeOverride?: ThemeScheme;
}

export function ThemeProvider({ children, schemeOverride }: ThemeProviderProps) {
  const preferences = usePreferences();
  const deviceScheme = useColorScheme();
  // Override the application-wide color scheme so native UIKit/Android views
  // (e.g. the native stack navigator's back button) follow the user's choice
  // instead of the system appearance.
  useEffect(() => {
    if (schemeOverride !== undefined) {
      return;
    }
    if (preferences.themeMode === 'system') {
      Appearance.setColorScheme(null);
    } else {
      Appearance.setColorScheme(preferences.themeMode);
    }
  }, [preferences.themeMode, schemeOverride]);
  const scheme =
    schemeOverride ??
    (preferences.themeMode === 'system'
      ? deviceScheme === 'dark'
        ? 'dark'
        : 'light'
      : preferences.themeMode);
  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: scheme === 'dark' ? darkColors : lightColors,
      scheme,
    }),
    [scheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
