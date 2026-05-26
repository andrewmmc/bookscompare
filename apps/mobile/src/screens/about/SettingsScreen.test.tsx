import { fireEvent } from '@testing-library/react-native';

import { SettingsScreen } from './SettingsScreen';
import { track } from '../../analytics';
import { renderWithProviders } from '../../test/test-utils';

import type { Preferences } from '../../lib/preferences';

jest.mock('../../analytics', () => ({
  track: jest.fn(),
}));

const mockShowActionSheetWithOptions = jest.fn();
const mockUpdatePreference = jest.fn();
const mockGetPreferences = jest.fn<Preferences, []>(() => ({
  openLinksIn: 'app',
  themeMode: 'system',
}));

jest.mock('@expo/react-native-action-sheet', () => {
  const { ActionSheetProvider } = jest.requireActual('@expo/react-native-action-sheet');
  return {
    ActionSheetProvider,
    useActionSheet: () => ({
      showActionSheetWithOptions: (...args: unknown[]) => mockShowActionSheetWithOptions(...args),
    }),
  };
});

jest.mock('../../lib/preferences', () => ({
  usePreferences: () => mockGetPreferences(),
  updatePreference: (...args: unknown[]) => mockUpdatePreference(...args),
}));

describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.mocked(track).mockReset();
    mockUpdatePreference.mockReset();
    mockShowActionSheetWithOptions.mockReset();
    mockGetPreferences.mockReturnValue({ openLinksIn: 'app', themeMode: 'system' });
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
  });

  it('persists open links preference when changed via action sheet', () => {
    mockShowActionSheetWithOptions.mockImplementation(
      (_options: unknown, callback: (index: number) => void) => {
        callback(1);
      }
    );

    const screen = renderWithProviders(
      <SettingsScreen
        navigation={{} as never}
        route={{ key: 'Settings', name: 'Settings' } as never}
      />
    );

    fireEvent.press(screen.getByText(/在 App 內開啟/));

    expect(mockUpdatePreference).toHaveBeenCalledWith('openLinksIn', 'browser');
    expect(track).toHaveBeenCalledWith('settings_change', {
      key: 'openLinksIn',
      value: 'browser',
    });
  });

  it('persists theme mode preference when changed via action sheet', () => {
    mockShowActionSheetWithOptions.mockImplementation(
      (_options: unknown, callback: (index: number) => void) => {
        callback(2);
      }
    );

    const screen = renderWithProviders(
      <SettingsScreen
        navigation={{} as never}
        route={{ key: 'Settings', name: 'Settings' } as never}
      />
    );

    fireEvent.press(screen.getByText(/跟隨系統/));

    expect(mockUpdatePreference).toHaveBeenCalledWith('themeMode', 'dark');
    expect(track).toHaveBeenCalledWith('settings_change', {
      key: 'themeMode',
      value: 'dark',
    });
  });

  it('does not persist when action sheet is cancelled', () => {
    mockShowActionSheetWithOptions.mockImplementation(
      (_options: unknown, callback: (index: number) => void) => {
        callback(2);
      }
    );

    const screen = renderWithProviders(
      <SettingsScreen
        navigation={{} as never}
        route={{ key: 'Settings', name: 'Settings' } as never}
      />
    );

    fireEvent.press(screen.getByText(/在 App 內開啟/));

    expect(mockUpdatePreference).not.toHaveBeenCalled();
    expect(track).not.toHaveBeenCalled();
  });

  it('does not persist when same option is selected', () => {
    mockShowActionSheetWithOptions.mockImplementation(
      (_options: unknown, callback: (index: number) => void) => {
        callback(0);
      }
    );

    const screen = renderWithProviders(
      <SettingsScreen
        navigation={{} as never}
        route={{ key: 'Settings', name: 'Settings' } as never}
      />
    );

    fireEvent.press(screen.getByText(/在 App 內開啟/));

    expect(mockUpdatePreference).not.toHaveBeenCalled();
  });
});
