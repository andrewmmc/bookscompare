import { fireEvent } from '@testing-library/react-native';

import { OpenLinksPreferencesScreen } from './OpenLinksPreferencesScreen';
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
}));

jest.mock('../../lib/preferences', () => ({
  usePreferences: () => mockGetPreferences(),
  updatePreference: (...args: unknown[]) => mockUpdatePreference(...args),
}));

describe('OpenLinksPreferencesScreen', () => {
  beforeEach(() => {
    jest.mocked(track).mockReset();
    mockUpdatePreference.mockReset();
    mockGetPreferences.mockReturnValue({
      openLinksIn: 'app',
      themeMode: 'system',
      preferredSources: [],
      preferredBookTypes: [],
    });
  });

  it('renders all open link options', () => {
    const screen = renderWithProviders(
      <OpenLinksPreferencesScreen
        navigation={{} as never}
        route={{ key: 'OpenLinksPreferences', name: 'OpenLinksPreferences' } as never}
      />
    );

    expect(screen.getByText('在 App 內開啟')).toBeOnTheScreen();
    expect(screen.getByText('在瀏覽器開啟')).toBeOnTheScreen();
  });

  it('persists the selected open link option', () => {
    const screen = renderWithProviders(
      <OpenLinksPreferencesScreen
        navigation={{} as never}
        route={{ key: 'OpenLinksPreferences', name: 'OpenLinksPreferences' } as never}
      />
    );

    fireEvent.press(screen.getByTestId('open-links-option-browser'));

    expect(mockUpdatePreference).toHaveBeenCalledWith('openLinksIn', 'browser');
    expect(track).toHaveBeenCalledWith('settings_change', {
      key: 'openLinksIn',
      value: 'browser',
    });
  });

  it('does not persist when the selected option is pressed again', () => {
    const screen = renderWithProviders(
      <OpenLinksPreferencesScreen
        navigation={{} as never}
        route={{ key: 'OpenLinksPreferences', name: 'OpenLinksPreferences' } as never}
      />
    );

    fireEvent.press(screen.getByTestId('open-links-option-app'));

    expect(mockUpdatePreference).not.toHaveBeenCalled();
    expect(track).not.toHaveBeenCalled();
  });

  it('marks the current option as selected', () => {
    mockGetPreferences.mockReturnValue({
      openLinksIn: 'browser',
      themeMode: 'system',
      preferredSources: [],
      preferredBookTypes: [],
    });

    const screen = renderWithProviders(
      <OpenLinksPreferencesScreen
        navigation={{} as never}
        route={{ key: 'OpenLinksPreferences', name: 'OpenLinksPreferences' } as never}
      />
    );

    expect(screen.getByTestId('open-links-option-browser').props.accessibilityState).toEqual({
      selected: true,
    });
    expect(screen.getByTestId('open-links-option-app').props.accessibilityState).toEqual({
      selected: false,
    });
  });
});
