import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { WebViewScreen } from '../screens/common/WebViewScreen';
import { BarcodeScannerScreen } from '../screens/home/BarcodeScannerScreen';
import { HomeScreen } from '../screens/home/HomeScreen';
import { SearchResultScreen } from '../screens/home/SearchResultScreen';
import { strings } from '../i18n/strings';
import { colors } from '../theme/colors';

import type { HomeStackParamList } from './types';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStack() {
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
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: strings.navigation.home }}
      />
      <Stack.Screen
        name="BarcodeScanner"
        component={BarcodeScannerScreen}
        options={{ title: strings.navigation.barcodeScanner }}
      />
      <Stack.Screen
        name="SearchResult"
        component={SearchResultScreen}
        options={{ title: strings.navigation.searchResult }}
      />
      <Stack.Screen name="SearchWebView" component={WebViewScreen} />
    </Stack.Navigator>
  );
}
