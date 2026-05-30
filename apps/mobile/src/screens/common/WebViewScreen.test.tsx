import { Share } from 'react-native';
import { fireEvent, waitFor } from '@testing-library/react-native';

import { WebViewScreen } from './WebViewScreen';
import { track } from '../../analytics';
import { openExternalUrl } from '../../lib/linking';
import { renderWithProviders } from '../../test/test-utils';

import type { ReactNode } from 'react';

jest.mock('../../analytics', () => ({
  track: jest.fn(),
}));

jest.mock('../../lib/linking', () => ({
  openExternalUrl: jest.fn(),
}));

jest.mock('@expo/react-native-action-sheet', () => ({
  ActionSheetProvider: ({ children }: { children: ReactNode }) => children,
  useActionSheet: () => ({ showActionSheetWithOptions: jest.fn() }),
}));

jest.mock('@react-navigation/bottom-tabs', () => {
  const actual = jest.requireActual('@react-navigation/bottom-tabs');

  return {
    ...actual,
    useBottomTabBarHeight: () => 48,
  };
});

jest.mock('react-native-webview', () => ({
  WebView: ({
    style,
    onError,
    onHttpError,
    onLoadEnd,
  }: {
    style?: unknown;
    onError?: () => void;
    onHttpError?: (event: { nativeEvent: { statusCode: number } }) => void;
    onLoadEnd?: () => void;
  }) => {
    const { View } = jest.requireActual('react-native');

    return (
      <View
        testID="mock-webview"
        onLayout={() => onLoadEnd?.()}
        onResponderEnd={() => onError?.()}
        onTouchEnd={() => onHttpError?.({ nativeEvent: { statusCode: 404 } })}
        style={style}
      />
    );
  },
}));

describe('WebViewScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

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

  it('does not add a share action when options are hidden', () => {
    const navigation = {
      setOptions: jest.fn(),
    };

    renderWithProviders(
      <WebViewScreen
        navigation={navigation as never}
        route={
          {
            key: 'SearchWebView',
            name: 'SearchWebView',
            params: { title: '測試頁面', url: 'https://example.com', showOptions: false },
          } as never
        }
      />
    );

    expect(navigation.setOptions).toHaveBeenLastCalledWith({ title: '測試頁面' });
  });

  it('adds bottom space for the tab bar', () => {
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

    expect(screen.getByTestId('mock-webview')).toHaveStyle({ marginBottom: 48 });
  });

  it('hides the loading overlay after the web view finishes loading', () => {
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
            params: { title: '測試頁面', url: 'https://example.com', showOptions: false },
          } as never
        }
      />
    );

    expect(screen.getByText('正在打開書店頁面…')).toBeTruthy();

    fireEvent(screen.getByTestId('mock-webview'), 'layout');

    expect(screen.queryByText('正在打開書店頁面…')).toBeNull();
  });

  it('shows a friendly error state on web view load errors', () => {
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
            params: { title: '測試頁面', url: 'https://example.com', showOptions: false },
          } as never
        }
      />
    );

    fireEvent(screen.getByTestId('mock-webview'), 'responderEnd');

    expect(screen.getByText('未能載入內容')).toBeTruthy();
  });

  it('opens failed pages externally from the error state', () => {
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
            params: { title: '測試頁面', url: 'https://example.com', showOptions: false },
          } as never
        }
      />
    );

    fireEvent(screen.getByTestId('mock-webview'), 'responderEnd');
    fireEvent.press(screen.getByText('在瀏覽器開啟'));

    expect(openExternalUrl).toHaveBeenCalledWith('https://example.com');
  });

  it('adds a share action when options are shown', () => {
    const navigation = {
      setOptions: jest.fn(),
    };

    renderWithProviders(
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

    expect(navigation.setOptions).toHaveBeenLastCalledWith(
      expect.objectContaining({
        title: '測試頁面',
        headerRight: expect.any(Function),
      })
    );
  });

  it('tracks share taps without falling back when share succeeds', async () => {
    const navigation = {
      setOptions: jest.fn(),
    };
    jest.spyOn(Share, 'share').mockResolvedValueOnce({ action: 'sharedAction' });

    renderWithProviders(
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

    const headerRight = navigation.setOptions.mock.calls.at(-1)?.[0].headerRight as () => ReactNode;
    const header = renderWithProviders(<>{headerRight()}</>);

    fireEvent.press(header.getByLabelText('分享'));

    await waitFor(() =>
      expect(Share.share).toHaveBeenCalledWith({
        title: '測試頁面',
        message: 'https://example.com',
        url: 'https://example.com',
      })
    );
    expect(track).toHaveBeenCalledWith('webview_share', { title: '測試頁面' });
    expect(openExternalUrl).not.toHaveBeenCalled();
  });

  it('tracks share taps and falls back to opening externally when share fails', async () => {
    const navigation = {
      setOptions: jest.fn(),
    };
    jest.spyOn(Share, 'share').mockRejectedValueOnce(new Error('share unavailable'));

    renderWithProviders(
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

    const headerRight = navigation.setOptions.mock.calls.at(-1)?.[0].headerRight as () => ReactNode;
    const header = renderWithProviders(<>{headerRight()}</>);

    fireEvent.press(header.getByLabelText('分享'));

    expect(track).toHaveBeenCalledWith('webview_share', { title: '測試頁面' });
    expect(Share.share).toHaveBeenCalledWith({
      title: '測試頁面',
      message: 'https://example.com',
      url: 'https://example.com',
    });
    await waitFor(() => expect(openExternalUrl).toHaveBeenCalledWith('https://example.com'));
  });
});
