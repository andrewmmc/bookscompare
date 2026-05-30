import { fireEvent } from '@testing-library/react-native';

import { AboutScreen } from './AboutScreen';
import { openExternalUrl } from '../../lib/linking';
import { renderWithProviders } from '../../test/test-utils';

import type { Preferences } from '../../lib/preferences';

jest.mock('../../lib/linking', () => ({
  openExternalUrl: jest.fn(),
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

describe('AboutScreen', () => {
  beforeEach(() => {
    jest.mocked(openExternalUrl).mockReset();
    mockUpdatePreference.mockReset();
    mockGetPreferences.mockReturnValue({
      openLinksIn: 'app',
      themeMode: 'system',
      preferredSources: [],
      preferredBookTypes: [],
    });
  });

  it('opens in-app links in the webview screen when preference is app', () => {
    const navigation = {
      navigate: jest.fn(),
    };

    const screen = renderWithProviders(
      <AboutScreen
        navigation={navigation as never}
        route={{ key: 'About', name: 'About' } as never}
      />
    );

    fireEvent.press(screen.getByText('使用條款及私隱政策'));

    expect(navigation.navigate).toHaveBeenCalledWith('AboutWebView', {
      title: '使用條款及私隱政策',
      url: 'https://bookscompare.mmc.dev/privacy?embed=1',
    });
  });

  it('opens links externally when preference is browser', () => {
    mockGetPreferences.mockReturnValue({
      openLinksIn: 'browser',
      themeMode: 'system',
      preferredSources: [],
      preferredBookTypes: [],
    });

    const navigation = {
      navigate: jest.fn(),
    };

    const screen = renderWithProviders(
      <AboutScreen
        navigation={navigation as never}
        route={{ key: 'About', name: 'About' } as never}
      />
    );

    fireEvent.press(screen.getByText('提交意見'));

    expect(navigation.navigate).not.toHaveBeenCalled();
    expect(openExternalUrl).toHaveBeenCalledWith(
      'https://github.com/andrewmmc/bookscompare/issues'
    );
  });

  it('navigates to settings screen', () => {
    const navigation = {
      navigate: jest.fn(),
    };

    const screen = renderWithProviders(
      <AboutScreen
        navigation={navigation as never}
        route={{ key: 'About', name: 'About' } as never}
      />
    );

    fireEvent.press(screen.getByText('設定'));

    expect(navigation.navigate).toHaveBeenCalledWith('Settings');
  });
});
