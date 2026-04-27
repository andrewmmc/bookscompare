import { fireEvent } from '@testing-library/react-native';

import { WebViewScreen } from './WebViewScreen';
import { renderWithProviders } from '../../test/test-utils';

import type { ReactNode } from 'react';

jest.mock('@expo/react-native-action-sheet', () => ({
  ActionSheetProvider: ({ children }: { children: ReactNode }) => children,
  useActionSheet: () => ({ showActionSheetWithOptions: jest.fn() }),
}));

jest.mock('react-native-webview', () => ({
  WebView: ({
    onHttpError,
  }: {
    onHttpError?: (event: { nativeEvent: { statusCode: number } }) => void;
  }) => {
    const { View } = jest.requireActual('react-native');

    return (
      <View
        testID="mock-webview"
        onTouchEnd={() => onHttpError?.({ nativeEvent: { statusCode: 404 } })}
      />
    );
  },
}));

describe('WebViewScreen', () => {
  it('shows a friendly empty state on 404 pages', () => {
    const navigation = {
      setOptions: jest.fn(),
    };

    const screen = renderWithProviders(
      <WebViewScreen
        navigation={navigation as never}
        route={
          {
            key: 'SearchWebView',
            name: 'SearchWebView',
            params: { title: '測試頁面', url: 'https://example.com', showOptions: true },
          } as never
        }
      />
    );

    fireEvent(screen.getByTestId('mock-webview'), 'onTouchEnd');

    expect(screen.getByText('頁面仍在準備中')).toBeTruthy();
  });
});
