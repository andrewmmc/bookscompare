import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AboutScreen } from '../screens/about/AboutScreen';
import { WebViewScreen } from '../screens/common/WebViewScreen';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

import type { AboutStackParamList } from './types';

const Stack = createNativeStackNavigator<AboutStackParamList>();
const headerTitleStyle = {
  fontFamily: typography.stackTitle.fontFamily,
  fontSize: typography.stackTitle.fontSize,
  fontWeight: '600' as const,
};

export function AboutStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTintColor: colors.accent,
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTitleStyle,
        contentStyle: {
          backgroundColor: colors.canvas,
        },
      }}
    >
      <Stack.Screen name="About" component={AboutScreen} options={{ title: '關於我們' }} />
      <Stack.Screen name="AboutWebView" component={WebViewScreen} />
    </Stack.Navigator>
  );
}
