import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { track } from '../analytics';
import { useTheme } from '../theme/ThemeProvider';

import { getCanvasStackScreenOptions } from './stackScreenOptions';

export function HomeStack() {
  const { t } = useTranslation(['navigation', 'home']);
  const { colors } = useTheme();

  return (
    <Stack screenOptions={getCanvasStackScreenOptions(colors)}>
      <Stack.Screen
        name="index"
        options={({ navigation }) => ({
          title: t('navigation:navigation.home'),
          headerBackTitle: '',
          headerLargeTitle: true,
          headerLeft: () => (
            <Pressable
              accessibilityLabel={t('home:home.historyAction')}
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => {
                track('home_click_history');
                navigation.navigate('History');
              }}
              style={({ pressed }) => [styles.headerLeft, pressed && styles.headerLeftPressed]}
            >
              <Ionicons color={colors.ink} name="time-outline" size={24} />
            </Pressable>
          ),
        })}
      />
      <Stack.Screen
        name="BarcodeScanner"
        options={{ title: t('navigation:navigation.barcodeScanner') }}
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
      <Stack.Screen
        name="History"
        options={{
          title: t('navigation:navigation.history'),
          headerBackTitle: '',
          headerBackButtonDisplayMode: 'minimal',
          headerLargeTitle: true,
          headerStyle: { backgroundColor: colors.groupedBackground },
          contentStyle: { backgroundColor: colors.groupedBackground },
        }}
      />
      <Stack.Screen name="SearchWebView" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  headerLeft: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLeftPressed: {
    opacity: 0.6,
  },
});
