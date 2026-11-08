import 'react-native-gesture-handler/jestSetup';

import path from 'path';
import { router } from 'expo-router';
import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';

import { i18n } from './i18n';

jest.mock('./analytics', () => ({
  initAnalytics: jest.fn(),
  track: jest.fn(),
  registerAnalyticsProperties: jest.fn(),
  identify: jest.fn(),
  setAnalyticsEnabled: jest.fn(),
}));

jest.mock('react-native-webview', () => {
  const { View } = jest.requireActual('react-native');
  return { WebView: View };
});

jest.mock('expo-camera', () => {
  const { View } = jest.requireActual('react-native');
  return {
    CameraView: View,
    useCameraPermissions: () => [{ granted: true }, jest.fn()],
  };
});

jest.mock('react-native-safe-area-context', () => {
  const actual = jest.requireActual('react-native-safe-area-context');
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    ...actual,
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
    useSafeAreaInsets: () => inset,
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
  };
});

const appDirectory = path.resolve(__dirname, 'app');

describe('App', () => {
  it('opens the home tab once preferences load', async () => {
    await renderRouter(appDirectory);

    await waitFor(() => {
      expect(screen.getByText(i18n.t('home.searchAction', { ns: 'home' }))).toBeTruthy();
    });
    expect(screen).toHavePathname('/');
    expect(screen).toHaveSegments(['(home)']);
  });

  it('pushes home stack screens from screen navigation calls', async () => {
    await renderRouter(appDirectory);
    const scanButton = await screen.findByLabelText(i18n.t('home.scanAction', { ns: 'home' }));

    await act(() => fireEvent.press(scanButton));

    expect(screen).toHaveSegments(['(home)', 'BarcodeScanner']);
  });

  it('routes to the favourites and about tabs', async () => {
    await renderRouter(appDirectory);
    await waitFor(() => {
      expect(screen).toHavePathname('/');
    });

    await act(() => router.navigate('/favourites'));
    expect(screen).toHaveSegments(['favourites']);

    await act(() => router.navigate('/about'));
    expect(screen).toHaveSegments(['about']);
  });
});
