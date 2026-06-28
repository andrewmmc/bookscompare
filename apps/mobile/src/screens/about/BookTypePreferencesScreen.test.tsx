import { fireEvent } from '@testing-library/react-native';

import { BookTypePreferencesScreen } from './BookTypePreferencesScreen';
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

describe('BookTypePreferencesScreen', () => {
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

  it('renders all book type toggles', () => {
    const screen = renderWithProviders(
      <BookTypePreferencesScreen
        navigation={{} as never}
        route={{ key: 'BookTypePreferences', name: 'BookTypePreferences' } as never}
      />
    );

    expect(screen.getByText('實體書')).toBeOnTheScreen();
    expect(screen.getByText('電子書')).toBeOnTheScreen();
  });

  it('toggles on ebook preference and persists it', () => {
    const screen = renderWithProviders(
      <BookTypePreferencesScreen
        navigation={{} as never}
        route={{ key: 'BookTypePreferences', name: 'BookTypePreferences' } as never}
      />
    );

    fireEvent(screen.getByTestId('book-type-toggle-ebook'), 'valueChange', true);

    expect(mockUpdatePreference).toHaveBeenCalledWith('preferredBookTypes', ['ebook']);
    expect(track).toHaveBeenCalledWith('settings_change', {
      key: 'preferredBookTypes',
      value: 'ebook',
    });
  });

  it('turning off one selected type keeps the other selected type', () => {
    mockGetPreferences.mockReturnValue({
      openLinksIn: 'app',
      themeMode: 'system',
      preferredSources: [],
      preferredBookTypes: ['physical', 'ebook'],
      icloudSyncEnabled: true,
    });

    const screen = renderWithProviders(
      <BookTypePreferencesScreen
        navigation={{} as never}
        route={{ key: 'BookTypePreferences', name: 'BookTypePreferences' } as never}
      />
    );

    fireEvent(screen.getByTestId('book-type-toggle-physical'), 'valueChange', false);

    expect(mockUpdatePreference).toHaveBeenCalledWith('preferredBookTypes', ['ebook']);
    expect(track).toHaveBeenCalledWith('settings_change', {
      key: 'preferredBookTypes',
      value: 'ebook',
    });
  });

  it('reflects the currently selected book type', () => {
    mockGetPreferences.mockReturnValue({
      openLinksIn: 'app',
      themeMode: 'system',
      preferredSources: [],
      preferredBookTypes: ['ebook'],
      icloudSyncEnabled: true,
    });

    const screen = renderWithProviders(
      <BookTypePreferencesScreen
        navigation={{} as never}
        route={{ key: 'BookTypePreferences', name: 'BookTypePreferences' } as never}
      />
    );

    expect(screen.getByTestId('book-type-toggle-ebook').props.value).toBe(true);
    expect(screen.getByTestId('book-type-toggle-physical').props.value).toBe(false);
  });

  it('turning off the only selected type resets to all', () => {
    mockGetPreferences.mockReturnValue({
      openLinksIn: 'app',
      themeMode: 'system',
      preferredSources: [],
      preferredBookTypes: ['physical'],
      icloudSyncEnabled: true,
    });

    const screen = renderWithProviders(
      <BookTypePreferencesScreen
        navigation={{} as never}
        route={{ key: 'BookTypePreferences', name: 'BookTypePreferences' } as never}
      />
    );

    fireEvent(screen.getByTestId('book-type-toggle-physical'), 'valueChange', false);

    expect(mockUpdatePreference).toHaveBeenCalledWith('preferredBookTypes', []);
    expect(track).toHaveBeenCalledWith('settings_change', {
      key: 'preferredBookTypes',
      value: '',
    });
  });
});
