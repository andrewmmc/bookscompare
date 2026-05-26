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
  ink: '#444241',
  inkMuted: '#8f8f8f',
  border: '#e5e5e5',
  divider: '#d5d5d5',
  highlight: '#f5d8c7',
  highlightSoft: '#f5efe5',
  rowPressed: '#e5e5ea',
  groupedBackground: '#f2f2f7',
  success: '#5e7f5d',
  danger: '#ad4c3f',
  shadow: '#000000',
} satisfies ThemeColors;

export const darkColors = {
  accent: '#e87a5a',
  accentDeep: '#f0a088',
  accentSoft: '#5a2f24',
  canvas: '#121212',
  surface: '#1c1c1e',
  paper: '#242426',
  ink: '#f2f2f2',
  inkMuted: '#9a9a9e',
  border: '#2c2c2e',
  divider: '#2c2c2e',
  highlight: '#4b2f26',
  highlightSoft: '#2a211d',
  rowPressed: '#2c2c2e',
  groupedBackground: '#000000',
  success: '#78a076',
  danger: '#d56b5d',
  shadow: '#000000',
} satisfies ThemeColors;

export const colors = lightColors;
