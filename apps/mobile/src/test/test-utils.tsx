import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';

import { paperThemeDark, paperThemeLight } from '../theme/paperTheme';
import { ThemeProvider } from '../theme/ThemeProvider';

import type { ReactElement } from 'react';
import type { ThemeScheme } from '../theme/ThemeProvider';

interface RenderOptions {
  scheme?: ThemeScheme;
}

export function renderWithProviders(element: ReactElement, options: RenderOptions = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  const scheme = options.scheme ?? 'light';
  const paperTheme = scheme === 'dark' ? paperThemeDark : paperThemeLight;

  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider schemeOverride={scheme}>
        <PaperProvider theme={paperTheme}>
          <ActionSheetProvider>{element}</ActionSheetProvider>
        </PaperProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export function renderWithTheme(element: ReactElement, options: RenderOptions = {}) {
  return renderWithProviders(element, options);
}
