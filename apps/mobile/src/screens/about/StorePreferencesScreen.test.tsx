import { fireEvent } from '@testing-library/react-native';

import { StorePreferencesScreen } from './StorePreferencesScreen';
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

describe('StorePreferencesScreen', () => {
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

  it('renders all bookstore toggles', () => {
    const screen = renderWithProviders(
      <StorePreferencesScreen
        navigation={{} as never}
        route={{ key: 'StorePreferences', name: 'StorePreferences' } as never}
      />
    );

    expect(screen.getByText('博客來')).toBeOnTheScreen();
    expect(screen.getByText('金石堂')).toBeOnTheScreen();
    expect(screen.getByText('城邦讀書花園')).toBeOnTheScreen();
    expect(screen.getByText('誠品線上')).toBeOnTheScreen();
  });

  it('toggles are off when no preferred sources are set', () => {
    const screen = renderWithProviders(
      <StorePreferencesScreen
        navigation={{} as never}
        route={{ key: 'StorePreferences', name: 'StorePreferences' } as never}
      />
    );

    const toggle = screen.getByTestId('store-toggle-books-com-tw');
    expect(toggle.props.value).toBe(false);
  });

  it('toggles on a store and persists the preference', () => {
    const screen = renderWithProviders(
      <StorePreferencesScreen
        navigation={{} as never}
        route={{ key: 'StorePreferences', name: 'StorePreferences' } as never}
      />
    );

    fireEvent(screen.getByTestId('store-toggle-books-com-tw'), 'valueChange', true);

    expect(mockUpdatePreference).toHaveBeenCalledWith('preferredSources', ['books-com-tw']);
    expect(track).toHaveBeenCalledWith('settings_change', {
      key: 'preferredSources',
      value: 'books-com-tw',
    });
  });

  it('toggles off a store that was previously selected', () => {
    mockGetPreferences.mockReturnValue({
      openLinksIn: 'app',
      themeMode: 'system',
      preferredSources: ['books-com-tw', 'eslite'],
      preferredBookTypes: [],
    });

    const screen = renderWithProviders(
      <StorePreferencesScreen
        navigation={{} as never}
        route={{ key: 'StorePreferences', name: 'StorePreferences' } as never}
      />
    );

    fireEvent(screen.getByTestId('store-toggle-books-com-tw'), 'valueChange', false);

    expect(mockUpdatePreference).toHaveBeenCalledWith('preferredSources', ['eslite']);
  });

  it('reflects currently selected stores as toggled on', () => {
    mockGetPreferences.mockReturnValue({
      openLinksIn: 'app',
      themeMode: 'system',
      preferredSources: ['kingstone'],
      preferredBookTypes: [],
    });

    const screen = renderWithProviders(
      <StorePreferencesScreen
        navigation={{} as never}
        route={{ key: 'StorePreferences', name: 'StorePreferences' } as never}
      />
    );

    expect(screen.getByTestId('store-toggle-kingstone').props.value).toBe(true);
    expect(screen.getByTestId('store-toggle-books-com-tw').props.value).toBe(false);
  });
});
