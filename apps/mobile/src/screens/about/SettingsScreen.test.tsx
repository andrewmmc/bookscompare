import { fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

import { SettingsScreen, shouldShowIcloudSyncSetting } from './SettingsScreen';
import { renderWithProviders } from '../../test/test-utils';

import type { Preferences } from '../../lib/preferences';

const mockUpdatePreference = jest.fn();
const mockTrack = jest.fn();
const mockSetQueryData = jest.fn();
const mockRunInitialIcloudSync = jest.fn();
const mockClearIcloudData = jest.fn();
const mockResetAppData = jest.fn();

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

jest.mock('../../lib/icloudSync', () => ({
  clearIcloudData: (...args: unknown[]) => mockClearIcloudData(...args),
  runInitialIcloudSync: (...args: unknown[]) => mockRunInitialIcloudSync(...args),
}));

jest.mock('../../lib/appData', () => ({
  resetAppData: (...args: unknown[]) => mockResetAppData(...args),
}));

jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query');

  return {
    ...actual,
    useQueryClient: () => ({
      setQueryData: (...args: unknown[]) => mockSetQueryData(...args),
    }),
  };
});

describe('SettingsScreen', () => {
  const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());

  beforeEach(() => {
    alertSpy.mockClear();
    mockTrack.mockClear();
    mockClearIcloudData.mockClear();
    mockResetAppData.mockClear();
    mockUpdatePreference.mockClear();
    mockSetQueryData.mockClear();
    mockRunInitialIcloudSync.mockClear();
    mockGetPreferences.mockReturnValue({
      openLinksIn: 'app',
      themeMode: 'system',
      preferredSources: [],
      preferredBookTypes: [],
      icloudSyncEnabled: true,
    });
    mockResetAppData.mockResolvedValue({
      preferences: {
        openLinksIn: 'app',
        themeMode: 'system',
        preferredSources: [],
        preferredBookTypes: [],
        icloudSyncEnabled: true,
      },
      history: [],
      favourites: [],
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

  it('applies empty synced history and favourites results', async () => {
    mockGetPreferences.mockReturnValue({
      openLinksIn: 'app',
      themeMode: 'system',
      preferredSources: [],
      preferredBookTypes: [],
      icloudSyncEnabled: false,
    });
    mockUpdatePreference.mockResolvedValue({
      openLinksIn: 'app',
      themeMode: 'system',
      preferredSources: [],
      preferredBookTypes: [],
      icloudSyncEnabled: true,
    });
    mockRunInitialIcloudSync.mockResolvedValue({ history: [], favourites: [] });

    const screen = renderWithProviders(
      <SettingsScreen
        navigation={{} as never}
        route={{ key: 'Settings', name: 'Settings' } as never}
      />
    );

    fireEvent.press(screen.getByText('iCloud 同步'));

    await waitFor(() => {
      expect(mockSetQueryData).toHaveBeenCalledWith(['history'], []);
      expect(mockSetQueryData).toHaveBeenCalledWith(['favourites'], []);
    });
  });

  it('only shows the iCloud sync setting on iOS', () => {
    expect(shouldShowIcloudSyncSetting('ios')).toBe(true);
    expect(shouldShowIcloudSyncSetting('android')).toBe(false);
    expect(shouldShowIcloudSyncSetting('web')).toBe(false);
  });

  it('shows a warning alert before resetting all data', () => {
    const screen = renderWithProviders(
      <SettingsScreen
        navigation={{} as never}
        route={{ key: 'Settings', name: 'Settings' } as never}
      />
    );

    fireEvent.press(screen.getByText('重設所有資料'));

    expect(alertSpy).toHaveBeenCalledWith(
      '重設所有資料？',
      '此動作無法復原，所有本機設定、搜尋記錄與收藏都會被移除，並同時清除 iCloud 上的同步資料。',
      expect.any(Array)
    );
  });

  it('resets local data and clears iCloud data after confirmation', async () => {
    const screen = renderWithProviders(
      <SettingsScreen
        navigation={{} as never}
        route={{ key: 'Settings', name: 'Settings' } as never}
      />
    );

    fireEvent.press(screen.getByText('重設所有資料'));

    const buttons = alertSpy.mock.calls[0]?.[2];
    const confirmButton = buttons?.[1];
    expect(confirmButton).toBeDefined();
    confirmButton?.onPress?.();

    await waitFor(() => {
      expect(mockClearIcloudData).toHaveBeenCalledTimes(1);
      expect(mockResetAppData).toHaveBeenCalledTimes(1);
      expect(mockSetQueryData).toHaveBeenCalledWith(['history'], []);
      expect(mockSetQueryData).toHaveBeenCalledWith(['favourites'], []);
    });
  });
});
