export interface ThemeColors {
  accent: string;
  accentDeep: string;
  accentSoft: string;
  canvas: string;
  surface: string;
  paper: string;
  ink: string;
  inkMuted: string;
  border: string;
  divider: string;
  highlight: string;
  highlightSoft: string;
  rowPressed: string;
  groupedBackground: string;
  controlBackground: string;
  controlSelected: string;
  navigationAction: string;
  success: string;
  danger: string;
  shadow: string;
}

export const lightColors = {
  accent: '#ca5d3b',
  accentDeep: '#8b3a22',
  accentSoft: '#e8b39f',
  canvas: '#ffffff',
  surface: '#ffffff',
  paper: '#ffffff',
  ink: '#1c1c1e',
  inkMuted: '#8e8e93',
  border: '#e5e5ea',
  // iOS systemSeparator approx (~C6C6C8) — paired with StyleSheet.hairlineWidth.
  divider: '#c6c6c8',
  highlight: '#f5d8c7',
  highlightSoft: '#f5efe5',
  rowPressed: '#e5e5ea',
  // iOS systemGroupedBackground (slightly warmer/lighter than the canonical #f2f2f7).
  groupedBackground: '#f7f7f9',
  controlBackground: '#f7f7f9',
  controlSelected: '#ffffff',
  navigationAction: '#ca5d3b',
  success: '#5e7f5d',
  danger: '#d33d2e',
  shadow: '#000000',
} satisfies ThemeColors;

export const darkColors = {
  accent: '#e87a5a',
  accentDeep: '#f0a088',
  accentSoft: '#5a2f24',
  canvas: '#000000',
  surface: '#1c1c1e',
  paper: '#242426',
  ink: '#f2f2f2',
  inkMuted: '#8e8e93',
  border: '#2c2c2e',
  divider: '#38383a',
  highlight: '#4b2f26',
  highlightSoft: '#2a211d',
  rowPressed: '#2c2c2e',
  groupedBackground: '#000000',
  controlBackground: '#1c1c1e',
  controlSelected: '#2c2c2e',
  navigationAction: '#f2f2f2',
  success: '#78a076',
  danger: '#ff453a',
  shadow: '#000000',
} satisfies ThemeColors;

/** @deprecated Do not use at runtime — always use useTheme() for theme-reactive colors. */
export const colors = lightColors;
