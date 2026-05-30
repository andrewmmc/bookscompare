import { fireEvent } from '@testing-library/react-native';

import { SettingsScreen } from './SettingsScreen';
import { renderWithProviders } from '../../test/test-utils';

import type { Preferences } from '../../lib/preferences';

const mockGetPreferences = jest.fn<Preferences, []>(() => ({
  openLinksIn: 'app',
  themeMode: 'system',
  preferredSources: [],
  preferredBookTypes: [],
}));

jest.mock('../../lib/preferences', () => ({
  usePreferences: () => mockGetPreferences(),
}));

describe('SettingsScreen', () => {
  beforeEach(() => {
    mockGetPreferences.mockReturnValue({
      openLinksIn: 'app',
      themeMode: 'system',
      preferredSources: [],
      preferredBookTypes: [],
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
  });

  it('renders physical-books label when only physical books are preferred', () => {
    mockGetPreferences.mockReturnValue({
      openLinksIn: 'app',
      themeMode: 'light',
      preferredSources: [],
      preferredBookTypes: ['physical'],
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
});
