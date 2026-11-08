import { useTranslation } from 'react-i18next';
import { Stack } from 'expo-router';

import { useTheme } from '../theme/ThemeProvider';

import { getGroupedStackScreenOptions } from './stackScreenOptions';

export function AboutStack() {
  const { t } = useTranslation(['navigation', 'settings']);
  const { colors } = useTheme();

  return (
    <Stack screenOptions={getGroupedStackScreenOptions(colors)}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="Settings"
        options={{
          title: t('navigation:navigation.settings'),
          headerBackButtonDisplayMode: 'minimal',
        }}
      />
      <Stack.Screen
        name="LanguagePreferences"
        options={{
          title: t('settings:settings.language'),
          headerBackButtonDisplayMode: 'minimal',
        }}
      />
      <Stack.Screen
        name="OpenLinksPreferences"
        options={{
          title: t('settings:settings.openLinksIn'),
          headerBackButtonDisplayMode: 'minimal',
        }}
      />
      <Stack.Screen
        name="ThemePreferences"
        options={{
          title: t('settings:settings.appearance'),
          headerBackButtonDisplayMode: 'minimal',
        }}
      />
      <Stack.Screen
        name="StorePreferences"
        options={{
          title: t('settings:storePreferences.title'),
          headerBackButtonDisplayMode: 'minimal',
        }}
      />
      <Stack.Screen
        name="BookTypePreferences"
        options={{
          title: t('settings:settings.bookType'),
          headerBackButtonDisplayMode: 'minimal',
        }}
      />
      <Stack.Screen name="AboutWebView" options={{ headerBackButtonDisplayMode: 'minimal' }} />
    </Stack>
  );
}
