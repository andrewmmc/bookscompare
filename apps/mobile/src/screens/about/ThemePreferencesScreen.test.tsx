import { fireEvent } from '@testing-library/react-native';

import { ThemePreferencesScreen } from './ThemePreferencesScreen';
import { track } from '../../analytics';
import { renderWithProviders } from '../../test/test-utils';

import type { Preferences } from '../../lib/preferences';

jest.mock('../../analytics', () => ({
  track: jest.fn(),
}));

const mockUpdatePreference = jest.fn();
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

describe('ThemePreferencesScreen', () => {
  beforeEach(() => {
    jest.mocked(track).mockReset();
    mockUpdatePreference.mockReset();
    mockGetPreferences.mockReturnValue({
      openLinksIn: 'app',
      themeMode: 'system',
      preferredSources: [],
      preferredBookTypes: [],
      icloudSyncEnabled: true,
    });
  });

  it('renders all appearance options', () => {
    const screen = renderWithProviders(
      <ThemePreferencesScreen
        navigation={{} as never}
        route={{ key: 'ThemePreferences', name: 'ThemePreferences' } as never}
      />
    );

    expect(screen.getByText('跟隨系統')).toBeOnTheScreen();
    expect(screen.getByText('淺色')).toBeOnTheScreen();
    expect(screen.getByText('深色')).toBeOnTheScreen();
  });

  it('persists the selected theme option', () => {
    const screen = renderWithProviders(
      <ThemePreferencesScreen
        navigation={{} as never}
        route={{ key: 'ThemePreferences', name: 'ThemePreferences' } as never}
      />
    );

    fireEvent.press(screen.getByTestId('theme-option-dark'));

    expect(mockUpdatePreference).toHaveBeenCalledWith('themeMode', 'dark');
    expect(track).toHaveBeenCalledWith('settings_change', {
      key: 'themeMode',
      value: 'dark',
    });
  });

  it('does not persist when the selected option is pressed again', () => {
    const screen = renderWithProviders(
      <ThemePreferencesScreen
        navigation={{} as never}
        route={{ key: 'ThemePreferences', name: 'ThemePreferences' } as never}
      />
    );

    fireEvent.press(screen.getByTestId('theme-option-system'));

    expect(mockUpdatePreference).not.toHaveBeenCalled();
    expect(track).not.toHaveBeenCalled();
  });

  it('marks the current theme option as selected', () => {
    mockGetPreferences.mockReturnValue({
      openLinksIn: 'app',
      themeMode: 'light',
      preferredSources: [],
      preferredBookTypes: [],
      icloudSyncEnabled: true,
    });

    const screen = renderWithProviders(
      <ThemePreferencesScreen
        navigation={{} as never}
        route={{ key: 'ThemePreferences', name: 'ThemePreferences' } as never}
      />
    );

    expect(screen.getByTestId('theme-option-light').props.accessibilityState).toEqual({
      selected: true,
    });
    expect(screen.getByTestId('theme-option-system').props.accessibilityState).toEqual({
      selected: false,
    });
  });
});
