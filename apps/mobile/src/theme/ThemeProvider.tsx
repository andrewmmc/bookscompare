import { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';

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
