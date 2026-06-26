import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AccountScreen } from '../screens/account/AccountScreen';
import { VerifyOtpScreen } from '../screens/account/VerifyOtpScreen';
import { AboutScreen } from '../screens/about/AboutScreen';
import { BookTypePreferencesScreen } from '../screens/about/BookTypePreferencesScreen';
import { OpenLinksPreferencesScreen } from '../screens/about/OpenLinksPreferencesScreen';
import { SettingsScreen } from '../screens/about/SettingsScreen';
import { StorePreferencesScreen } from '../screens/about/StorePreferencesScreen';
import { ThemePreferencesScreen } from '../screens/about/ThemePreferencesScreen';
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
          title: strings.navigation.settings,
          headerBackButtonDisplayMode: 'minimal',
        }}
      />
      <Stack.Screen
        name="Account"
        component={AccountScreen}
        options={{
          title: strings.account.navTitle,
          headerBackButtonDisplayMode: 'minimal',
        }}
      />
      <Stack.Screen
        name="VerifyOtp"
        component={VerifyOtpScreen}
        options={{
          title: strings.account.verifyTitle,
          headerBackButtonDisplayMode: 'minimal',
        }}
      />
      <Stack.Screen
        name="OpenLinksPreferences"
        component={OpenLinksPreferencesScreen}
        options={{
          title: strings.settings.openLinksIn,
          headerBackButtonDisplayMode: 'minimal',
        }}
      />
      <Stack.Screen
        name="ThemePreferences"
        component={ThemePreferencesScreen}
        options={{
          title: strings.settings.appearance,
          headerBackButtonDisplayMode: 'minimal',
        }}
      />
      <Stack.Screen
        name="StorePreferences"
        component={StorePreferencesScreen}
        options={{
          title: strings.storePreferences.title,
          headerBackButtonDisplayMode: 'minimal',
        }}
      />
      <Stack.Screen
        name="BookTypePreferences"
        component={BookTypePreferencesScreen}
        options={{
          title: strings.settings.bookType,
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
