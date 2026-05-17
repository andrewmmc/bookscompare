import { MD3LightTheme } from 'react-native-paper';

import { colors } from './colors';

export const paperTheme = {
  ...MD3LightTheme,
  roundness: 4,
  colors: {
    ...MD3LightTheme.colors,
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
      ...MD3LightTheme.colors.elevation,
      level1: '#ffffff',
      level2: '#ffffff',
      level3: '#ffffff',
      level4: '#ffffff',
      level5: '#ffffff',
    },
  },
};
