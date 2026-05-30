import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AboutScreen } from '../screens/about/AboutScreen';
import { BookTypePreferencesScreen } from '../screens/about/BookTypePreferencesScreen';
import { SettingsScreen } from '../screens/about/SettingsScreen';
import { StorePreferencesScreen } from '../screens/about/StorePreferencesScreen';
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
      <Stack.Screen
        name="StorePreferences"
        component={StorePreferencesScreen}
        options={{ title: strings.storePreferences.title }}
      />
      <Stack.Screen
        name="BookTypePreferences"
        component={BookTypePreferencesScreen}
        options={{ title: strings.settings.bookType }}
      />
      <Stack.Screen name="AboutWebView" component={WebViewScreen} />
    </Stack.Navigator>
  );
}
