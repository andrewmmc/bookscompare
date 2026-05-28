import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AboutScreen } from '../screens/about/AboutScreen';
import { SettingsScreen } from '../screens/about/SettingsScreen';
import { WebViewScreen } from '../screens/common/WebViewScreen';
import { strings } from '../i18n/strings';
import { useTheme } from '../theme/ThemeProvider';

import type { AboutStackParamList } from './types';

const Stack = createNativeStackNavigator<AboutStackParamList>();

export function AboutStack() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerTintColor: colors.navigationAction,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.groupedBackground },
        headerTitleStyle: {
          color: colors.ink,
          fontSize: 17,
          fontWeight: '600',
        },
        contentStyle: {
          backgroundColor: colors.groupedBackground,
        },
      }}
    >
      <Stack.Screen
        name="About"
        component={AboutScreen}
        options={{ title: strings.navigation.about, headerLargeTitle: true }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: strings.navigation.settings }}
      />
      <Stack.Screen name="AboutWebView" component={WebViewScreen} />
    </Stack.Navigator>
  );
}
