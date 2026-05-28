import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { initAnalytics, registerAnalyticsProperties } from './analytics';
import { RootNavigator } from './navigation/RootNavigator';
import { paperThemeDark, paperThemeLight } from './theme/paperTheme';
import { ThemeProvider, useTheme } from './theme/ThemeProvider';

const queryClient = new QueryClient();

function AppContent() {
  const { colors, scheme } = useTheme();
  const paperTheme = scheme === 'dark' ? paperThemeDark : paperThemeLight;

  useEffect(() => {
    initAnalytics();
    registerAnalyticsProperties({ themeScheme: scheme });
  }, [scheme]);

  const navigationTheme = useMemo(
    () => ({
      ...(scheme === 'dark' ? DarkTheme : DefaultTheme),
      colors: {
        ...(scheme === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
        background: paperTheme.colors.background,
        card: paperTheme.colors.elevation.level2,
        border: paperTheme.colors.outlineVariant,
        primary: colors.navigationAction,
        text: paperTheme.colors.onSurface,
        notification: paperTheme.colors.secondary,
      },
    }),
    [colors.navigationAction, paperTheme, scheme]
  );

  return (
    <PaperProvider theme={paperTheme}>
      <ActionSheetProvider>
        <NavigationContainer theme={navigationTheme}>
          <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
          <RootNavigator />
        </NavigationContainer>
      </ActionSheetProvider>
    </PaperProvider>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AppContent />
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
