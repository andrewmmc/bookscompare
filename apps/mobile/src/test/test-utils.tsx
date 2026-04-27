import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';

import { paperTheme } from '../theme/paperTheme';

import type { ReactElement } from 'react';

export function renderWithProviders(element: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={paperTheme}>
        <ActionSheetProvider>{element}</ActionSheetProvider>
      </PaperProvider>
    </QueryClientProvider>
  );
}
