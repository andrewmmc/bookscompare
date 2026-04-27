import { MD3LightTheme } from 'react-native-paper';

import { colors } from './colors';

export const paperTheme = {
  ...MD3LightTheme,
  roundness: 5,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.accent,
    onPrimary: colors.surface,
    primaryContainer: colors.highlight,
    onPrimaryContainer: colors.accentDeep,
    secondary: colors.ink,
    background: colors.canvas,
    surface: colors.surface,
    surfaceVariant: colors.paper,
    onSurface: colors.ink,
    onSurfaceVariant: colors.inkMuted,
    outline: colors.border,
    outlineVariant: colors.border,
    error: colors.danger,
    elevation: {
      ...MD3LightTheme.colors.elevation,
      level1: '#fff9f1',
      level2: '#fff7ed',
      level3: '#fff3e7',
      level4: '#fff0e2',
      level5: '#ffe9da',
    },
  },
};
