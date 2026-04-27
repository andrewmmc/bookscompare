import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RootNavigator } from './navigation/RootNavigator';
import { paperTheme } from './theme/paperTheme';

const queryClient = new QueryClient();

export default function App() {
  const navigationTheme = useMemo(
    () => ({
      ...DefaultTheme,
      colors: {
        ...DefaultTheme.colors,
        background: paperTheme.colors.background,
        card: paperTheme.colors.elevation.level2,
        border: paperTheme.colors.outlineVariant,
        primary: paperTheme.colors.primary,
        text: paperTheme.colors.onSurface,
        notification: paperTheme.colors.secondary,
      },
    }),
    []
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <PaperProvider theme={paperTheme}>
            <ActionSheetProvider>
              <NavigationContainer theme={navigationTheme}>
                <StatusBar style="dark" />
                <RootNavigator />
              </NavigationContainer>
            </ActionSheetProvider>
          </PaperProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
