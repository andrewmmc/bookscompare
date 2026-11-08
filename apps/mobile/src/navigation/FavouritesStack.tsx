import { useTranslation } from 'react-i18next';
import { Stack } from 'expo-router';

import { useTheme } from '../theme/ThemeProvider';

import { getGroupedStackScreenOptions } from './stackScreenOptions';

export function FavouritesStack() {
  const { t } = useTranslation('navigation');
  const { colors } = useTheme();

  return (
    <Stack screenOptions={getGroupedStackScreenOptions(colors)}>
      <Stack.Screen
        name="index"
        options={{
          title: t('navigation:navigation.favourites'),
          headerBackTitle: '',
          headerLargeTitle: true,
        }}
      />
      <Stack.Screen
        name="SearchResult"
        options={{
          title: t('navigation:navigation.searchResult'),
          headerBackTitle: '',
          headerBackButtonDisplayMode: 'minimal',
          headerStyle: { backgroundColor: colors.groupedBackground },
          contentStyle: { backgroundColor: colors.groupedBackground },
        }}
      />
      <Stack.Screen name="SearchWebView" />
    </Stack>
  );
}
