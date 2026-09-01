import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { AboutScreen } from '../screens/about/AboutScreen';
import { BookTypePreferencesScreen } from '../screens/about/BookTypePreferencesScreen';
import { LanguagePreferencesScreen } from '../screens/about/LanguagePreferencesScreen';
import { OpenLinksPreferencesScreen } from '../screens/about/OpenLinksPreferencesScreen';
import { SettingsScreen } from '../screens/about/SettingsScreen';
import { StorePreferencesScreen } from '../screens/about/StorePreferencesScreen';
import { ThemePreferencesScreen } from '../screens/about/ThemePreferencesScreen';
import { WebViewScreen } from '../screens/common/WebViewScreen';
import { useTheme } from '../theme/ThemeProvider';

import type { AboutStackParamList } from './types';

const Stack = createNativeStackNavigator<AboutStackParamList>();

export function AboutStack() {
  const { t } = useTranslation(['navigation', 'settings']);
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
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
      }}
    >
      <Stack.Screen name="About" component={AboutScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: t('navigation:navigation.settings'),
          headerBackButtonDisplayMode: 'minimal',
        }}
      />
      <Stack.Screen
        name="LanguagePreferences"
        component={LanguagePreferencesScreen}
        options={{
          title: t('settings.language'),
          headerBackButtonDisplayMode: 'minimal',
        }}
      />
      <Stack.Screen
        name="OpenLinksPreferences"
        component={OpenLinksPreferencesScreen}
        options={{
          title: t('settings:settings.openLinksIn'),
          headerBackButtonDisplayMode: 'minimal',
        }}
      />
      <Stack.Screen
        name="ThemePreferences"
        component={ThemePreferencesScreen}
        options={{
          title: t('settings:settings.appearance'),
          headerBackButtonDisplayMode: 'minimal',
        }}
      />
      <Stack.Screen
        name="StorePreferences"
        component={StorePreferencesScreen}
        options={{
          title: t('settings:storePreferences.title'),
          headerBackButtonDisplayMode: 'minimal',
        }}
      />
      <Stack.Screen
        name="BookTypePreferences"
        component={BookTypePreferencesScreen}
        options={{
          title: t('settings:settings.bookType'),
          headerBackButtonDisplayMode: 'minimal',
        }}
      />
      <Stack.Screen
        name="AboutWebView"
        component={WebViewScreen}
        options={{ headerBackButtonDisplayMode: 'minimal' }}
      />
    </Stack.Navigator>
  );
}
