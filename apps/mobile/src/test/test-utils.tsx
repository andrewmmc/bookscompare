import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';
import { Dimensions } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '../i18n';
import { paperThemeDark, paperThemeLight } from '../theme/paperTheme';
import { ThemeProvider } from '../theme/ThemeProvider';

import type { ReactElement } from 'react';
import type { EdgeInsets } from 'react-native-safe-area-context';
import type { ThemeScheme } from '../theme/ThemeProvider';

interface RenderOptions {
  scheme?: ThemeScheme;
  safeAreaInsets?: Partial<EdgeInsets>;
}

export function renderWithProviders(element: ReactElement, options: RenderOptions = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: Infinity,
        retry: false,
      },
      mutations: {
        gcTime: Infinity,
      },
    },
  });
  const scheme = options.scheme ?? 'light';
  const paperTheme = scheme === 'dark' ? paperThemeDark : paperThemeLight;
  const { width, height } = Dimensions.get('window');
  const safeAreaMetrics = {
    frame: { x: 0, y: 0, width, height },
    insets: { top: 0, right: 0, bottom: 0, left: 0, ...options.safeAreaInsets },
  };

  return render(
    <GestureHandlerRootView>
      <SafeAreaProvider initialMetrics={safeAreaMetrics}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider schemeOverride={scheme}>
            <PaperProvider theme={paperTheme}>
              <ActionSheetProvider>
                <BottomTabBarHeightContext.Provider value={0}>
                  {element}
                </BottomTabBarHeightContext.Provider>
              </ActionSheetProvider>
            </PaperProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
