import { fireEvent } from '@testing-library/react-native';

import { LanguagePreferencesScreen } from './LanguagePreferencesScreen';
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
  languagePreference: 'system',
  preferredSources: [],
  preferredBookTypes: [],
  icloudSyncEnabled: true,
}));

jest.mock('../../lib/preferences', () => ({
  usePreferences: () => mockGetPreferences(),
  updatePreference: (...args: unknown[]) => mockUpdatePreference(...args),
}));

describe('LanguagePreferencesScreen', () => {
  beforeEach(() => {
    jest.mocked(track).mockReset();
    mockUpdatePreference.mockReset();
    mockGetPreferences.mockReturnValue({
      openLinksIn: 'app',
      themeMode: 'system',
      languagePreference: 'system',
      preferredSources: [],
      preferredBookTypes: [],
      icloudSyncEnabled: true,
    });
  });

  it('renders all language options', async () => {
    const screen = await renderWithProviders(
      <LanguagePreferencesScreen
        navigation={{} as never}
        route={{ key: 'LanguagePreferences', name: 'LanguagePreferences' } as never}
      />
    );

    expect(screen.getByText('跟隨系統')).toBeOnTheScreen();
    expect(screen.getByText('English')).toBeOnTheScreen();
    expect(screen.getByText('繁體中文')).toBeOnTheScreen();
  });

  it('persists the selected language without syncing it', async () => {
    const screen = await renderWithProviders(
      <LanguagePreferencesScreen
        navigation={{} as never}
        route={{ key: 'LanguagePreferences', name: 'LanguagePreferences' } as never}
      />
    );

    await fireEvent.press(screen.getByTestId('language-option-en'));

    expect(mockUpdatePreference).toHaveBeenCalledWith('languagePreference', 'en');
    expect(track).toHaveBeenCalledWith('settings_change', {
      key: 'languagePreference',
      value: 'en',
    });
  });
});
