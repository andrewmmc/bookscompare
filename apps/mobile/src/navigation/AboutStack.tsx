import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AboutScreen } from '../screens/about/AboutScreen';
import { WebViewScreen } from '../screens/common/WebViewScreen';
import { colors } from '../theme/colors';

import type { AboutStackParamList } from './types';

const Stack = createNativeStackNavigator<AboutStackParamList>();

export function AboutStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTintColor: colors.accent,
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTitleStyle: {
          color: colors.ink,
          fontSize: 17,
          fontWeight: '600',
        },
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
