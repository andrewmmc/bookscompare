import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { WebViewScreen } from '../screens/common/WebViewScreen';
import { FavouritesScreen } from '../screens/favourites/FavouritesScreen';
import { SearchResultScreen } from '../screens/home/SearchResultScreen';
import { strings } from '../i18n/strings';
import { colors } from '../theme/colors';

import type { FavouritesStackParamList } from './types';

const Stack = createNativeStackNavigator<FavouritesStackParamList>();

export function FavouritesStack() {
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
        name="Favourites"
        component={FavouritesScreen}
        options={{ title: strings.navigation.favourites }}
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
