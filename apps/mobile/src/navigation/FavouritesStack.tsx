import { useTranslation } from 'react-i18next';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { WebViewScreen } from '../screens/common/WebViewScreen';
import { FavouritesScreen } from '../screens/favourites/FavouritesScreen';
import { SearchResultScreen } from '../screens/home/SearchResultScreen';
import { useTheme } from '../theme/ThemeProvider';

import type { FavouritesStackParamList } from './types';

const Stack = createNativeStackNavigator<FavouritesStackParamList>();

export function FavouritesStack() {
  const { t } = useTranslation('navigation');
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
      <Stack.Screen
        name="Favourites"
        component={FavouritesScreen}
        options={{
          title: t('navigation:navigation.favourites'),
          headerBackTitle: '',
          headerLargeTitle: true,
        }}
      />
      <Stack.Screen
        name="SearchResult"
        component={SearchResultScreen}
        options={{
          title: t('navigation:navigation.searchResult'),
          headerBackTitle: '',
          headerBackButtonDisplayMode: 'minimal',
          headerStyle: { backgroundColor: colors.groupedBackground },
          contentStyle: { backgroundColor: colors.groupedBackground },
        }}
      />
      <Stack.Screen name="SearchWebView" component={WebViewScreen} />
    </Stack.Navigator>
  );
}
