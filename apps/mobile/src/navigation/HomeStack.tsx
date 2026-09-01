import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Pressable, StyleSheet } from 'react-native';

import { track } from '../analytics';
import { WebViewScreen } from '../screens/common/WebViewScreen';
import { BarcodeScannerScreen } from '../screens/home/BarcodeScannerScreen';
import { HistoryScreen } from '../screens/home/HistoryScreen';
import { HomeScreen } from '../screens/home/HomeScreen';
import { SearchResultScreen } from '../screens/home/SearchResultScreen';
import { useTheme } from '../theme/ThemeProvider';

import type { HomeStackParamList } from './types';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStack() {
  const { t } = useTranslation(['navigation', 'home']);
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.canvas },
        headerTintColor: colors.navigationAction,
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
        component={BarcodeScannerScreen}
        options={{ title: t('navigation:navigation.barcodeScanner') }}
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
      <Stack.Screen
        name="History"
        component={HistoryScreen}
        options={{
          title: t('navigation:navigation.history'),
          headerBackTitle: '',
          headerBackButtonDisplayMode: 'minimal',
          headerLargeTitle: true,
          headerStyle: { backgroundColor: colors.groupedBackground },
          contentStyle: { backgroundColor: colors.groupedBackground },
        }}
      />
      <Stack.Screen name="SearchWebView" component={WebViewScreen} />
    </Stack.Navigator>
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
