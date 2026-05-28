import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

import { darkColors, lightColors } from './colors';

import type { ThemeColors } from './colors';

function buildPaperColors(colors: ThemeColors, baseColors: typeof MD3LightTheme.colors) {
  return {
    ...baseColors,
    primary: colors.accent,
    onPrimary: '#ffffff',
    primaryContainer: colors.highlight,
    onPrimaryContainer: colors.accentDeep,
    secondary: colors.ink,
    secondaryContainer: colors.highlight,
    onSecondaryContainer: colors.accentDeep,
    background: colors.canvas,
    surface: colors.surface,
    surfaceVariant: colors.paper,
    onSurface: colors.ink,
    onSurfaceVariant: colors.inkMuted,
    outline: colors.border,
    outlineVariant: colors.border,
    error: colors.danger,
    elevation: {
      ...baseColors.elevation,
      level1: colors.surface,
      level2: colors.surface,
      level3: colors.paper,
      level4: colors.paper,
      level5: colors.paper,
    },
  };
}

export const paperThemeLight = {
  ...MD3LightTheme,
  roundness: 4,
  colors: buildPaperColors(lightColors, MD3LightTheme.colors),
};

export const paperThemeDark = {
  ...MD3DarkTheme,
  roundness: 4,
  colors: buildPaperColors(darkColors, MD3DarkTheme.colors),
};

/** @deprecated Do not use at runtime — always use useTheme() for theme-reactive values. */
export const paperTheme = paperThemeLight;
