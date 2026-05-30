import 'react-native-gesture-handler/jestSetup';

import { render, screen, waitFor } from '@testing-library/react-native';

import App from './App';
import { strings } from './i18n/strings';

jest.mock('./analytics', () => ({
  initAnalytics: jest.fn(),
  track: jest.fn(),
  registerAnalyticsProperties: jest.fn(),
  identify: jest.fn(),
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

describe('App', () => {
  it('mounts and renders the tab navigator once preferences load', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(strings.tabs.home)).toBeTruthy();
    });
    expect(screen.getByText(strings.tabs.favourites)).toBeTruthy();
    expect(screen.getByText(strings.tabs.about)).toBeTruthy();
  });
});
