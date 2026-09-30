import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import type { ThemeColors } from '../theme/colors';

export function getGroupedStackScreenOptions(colors: ThemeColors): NativeStackNavigationOptions {
  return {
    headerShadowVisible: false,
    headerStyle: { backgroundColor: colors.groupedBackground },
    headerTintColor: colors.navigationAction,
    headerTitleStyle: {
      color: colors.ink,
      fontSize: 17,
      fontWeight: '600',
    },
    contentStyle: {
      backgroundColor: colors.groupedBackground,
    },
  };
}

export function getCanvasStackScreenOptions(colors: ThemeColors): NativeStackNavigationOptions {
  return {
    ...getGroupedStackScreenOptions(colors),
    headerStyle: { backgroundColor: colors.canvas },
    contentStyle: {
      backgroundColor: colors.canvas,
    },
  };
}
