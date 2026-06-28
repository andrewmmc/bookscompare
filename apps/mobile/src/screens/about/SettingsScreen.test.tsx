import { fireEvent } from '@testing-library/react-native';

import { SettingsScreen, shouldShowIcloudSyncSetting } from './SettingsScreen';
import { renderWithProviders } from '../../test/test-utils';

import type { Preferences } from '../../lib/preferences';

const mockUpdatePreference = jest.fn();
const mockTrack = jest.fn();

const mockGetPreferences = jest.fn<Preferences, []>(() => ({
  openLinksIn: 'app',
  themeMode: 'system',
  preferredSources: [],
  preferredBookTypes: [],
  icloudSyncEnabled: true,
}));

jest.mock('../../lib/preferences', () => ({
  usePreferences: () => mockGetPreferences(),
  updatePreference: (...args: unknown[]) => mockUpdatePreference(...args),
}));

jest.mock('../../analytics', () => ({
  track: (...args: unknown[]) => mockTrack(...args),
}));

describe('SettingsScreen', () => {
  beforeEach(() => {
    mockTrack.mockClear();
    mockUpdatePreference.mockClear();
    mockGetPreferences.mockReturnValue({
      openLinksIn: 'app',
      themeMode: 'system',
      preferredSources: [],
      preferredBookTypes: [],
      icloudSyncEnabled: true,
    });
  });

  it('renders current preferences', () => {
    const screen = renderWithProviders(
      <SettingsScreen
        navigation={{} as never}
        route={{ key: 'Settings', name: 'Settings' } as never}
      />
    );

    expect(screen.getByText(/在 App 內開啟/)).toBeOnTheScreen();
    expect(screen.getByText(/跟隨系統/)).toBeOnTheScreen();
    expect(screen.getAllByText(/^全部$/)).toHaveLength(2);
  });

  it('renders specific labels for browser, dark mode, ebook-only, and selected stores', () => {
    mockGetPreferences.mockReturnValue({
      openLinksIn: 'browser',
      themeMode: 'dark',
      preferredSources: ['books-com-tw', 'eslite'],
      preferredBookTypes: ['ebook'],
      icloudSyncEnabled: false,
    });

    const screen = renderWithProviders(
      <SettingsScreen
        navigation={{} as never}
        route={{ key: 'Settings', name: 'Settings' } as never}
      />
    );

    expect(screen.getByText('在瀏覽器開啟')).toBeOnTheScreen();
    expect(screen.getByText('深色')).toBeOnTheScreen();
    expect(screen.getByText('電子書')).toBeOnTheScreen();
    expect(screen.getByText('已選 2 家')).toBeOnTheScreen();
    expect(screen.getByText('關閉')).toBeOnTheScreen();
  });

  it('renders physical-books label when only physical books are preferred', () => {
    mockGetPreferences.mockReturnValue({
      openLinksIn: 'app',
      themeMode: 'light',
      preferredSources: [],
      preferredBookTypes: ['physical'],
      icloudSyncEnabled: true,
    });

    const screen = renderWithProviders(
      <SettingsScreen
        navigation={{} as never}
        route={{ key: 'Settings', name: 'Settings' } as never}
      />
    );

    expect(screen.getByText('實體書')).toBeOnTheScreen();
    expect(screen.getByText('淺色')).toBeOnTheScreen();
  });

  it('navigates to store preferences', () => {
    const navigation = { navigate: jest.fn() };

    const screen = renderWithProviders(
      <SettingsScreen
        navigation={navigation as never}
        route={{ key: 'Settings', name: 'Settings' } as never}
      />
    );

    fireEvent.press(screen.getByText('書店偏好'));

    expect(navigation.navigate).toHaveBeenCalledWith('StorePreferences');
  });

  it('navigates to book type preferences', () => {
    const navigation = { navigate: jest.fn() };

    const screen = renderWithProviders(
      <SettingsScreen
        navigation={navigation as never}
        route={{ key: 'Settings', name: 'Settings' } as never}
      />
    );

    fireEvent.press(screen.getByText('書籍類型'));

    expect(navigation.navigate).toHaveBeenCalledWith('BookTypePreferences');
  });

  it('navigates to open links preferences', () => {
    const navigation = { navigate: jest.fn() };

    const screen = renderWithProviders(
      <SettingsScreen
        navigation={navigation as never}
        route={{ key: 'Settings', name: 'Settings' } as never}
      />
    );

    fireEvent.press(screen.getByText(/在 App 內開啟/));

    expect(navigation.navigate).toHaveBeenCalledWith('OpenLinksPreferences');
  });

  it('navigates to theme preferences', () => {
    const navigation = { navigate: jest.fn() };

    const screen = renderWithProviders(
      <SettingsScreen
        navigation={navigation as never}
        route={{ key: 'Settings', name: 'Settings' } as never}
      />
    );

    fireEvent.press(screen.getByText(/跟隨系統/));

    expect(navigation.navigate).toHaveBeenCalledWith('ThemePreferences');
  });

  it('toggles iCloud sync from the iOS settings row', () => {
    const screen = renderWithProviders(
      <SettingsScreen
        navigation={{} as never}
        route={{ key: 'Settings', name: 'Settings' } as never}
      />
    );

    fireEvent.press(screen.getByText('iCloud 同步'));

    expect(mockTrack).toHaveBeenCalledWith('settings_change', {
      key: 'icloudSyncEnabled',
      value: 'false',
    });
    expect(mockUpdatePreference).toHaveBeenCalledWith('icloudSyncEnabled', false);
  });

  it('only shows the iCloud sync setting on iOS', () => {
    expect(shouldShowIcloudSyncSetting('ios')).toBe(true);
    expect(shouldShowIcloudSyncSetting('android')).toBe(false);
    expect(shouldShowIcloudSyncSetting('web')).toBe(false);
  });
});
