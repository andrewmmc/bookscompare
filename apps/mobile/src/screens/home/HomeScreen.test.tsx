import { fireEvent } from '@testing-library/react-native';

import { HomeScreen } from './HomeScreen';
import { track } from '../../analytics';
import { renderWithProviders } from '../../test/test-utils';

jest.mock('../../analytics', () => ({
  track: jest.fn(),
}));

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows title search while defaulting to ISBN search', () => {
    const navigation = {
      navigate: jest.fn(),
    };

    const screen = renderWithProviders(
      <HomeScreen navigation={navigation as never} route={{ key: 'Home', name: 'Home' } as never} />
    );

    expect(screen.getByText('書名')).toBeOnTheScreen();
    expect(screen.getByPlaceholderText('ISBN 碼')).toBeOnTheScreen();
    expect(
      screen.getByText(
        '掃描或輸入書本的國際標準書號 (ISBN 碼)，或直接輸入書名，輕鬆找到最心儀的價格！'
      )
    ).toBeOnTheScreen();
  });

  it('navigates to results with a normalized isbn', () => {
    const navigation = {
      navigate: jest.fn(),
    };

    const screen = renderWithProviders(
      <HomeScreen navigation={navigation as never} route={{ key: 'Home', name: 'Home' } as never} />
    );

    fireEvent.changeText(screen.getByPlaceholderText('ISBN 碼'), '978-1-4028-9462-6');
    fireEvent.press(screen.getByText('搜尋好書價'));

    expect(navigation.navigate).toHaveBeenCalledWith('SearchResult', { isbn: '9781402894626' });
    expect(track).toHaveBeenCalledWith('home_click_search', { isbnLength: 13 });
  });

  it('navigates to results with a trimmed title', () => {
    const navigation = {
      navigate: jest.fn(),
    };

    const screen = renderWithProviders(
      <HomeScreen navigation={navigation as never} route={{ key: 'Home', name: 'Home' } as never} />
    );

    fireEvent.press(screen.getByText('書名'));
    fireEvent.changeText(screen.getByPlaceholderText('輸入書名'), '  設計中的書  ');
    fireEvent.press(screen.getByText('搜尋好書價'));

    expect(navigation.navigate).toHaveBeenCalledWith('SearchResult', { title: '設計中的書' });
    expect(track).toHaveBeenCalledWith('home_click_search_title', { titleLength: 5 });
  });

  it('opens the barcode scanner from the camera button', () => {
    const navigation = {
      navigate: jest.fn(),
    };

    const screen = renderWithProviders(
      <HomeScreen navigation={navigation as never} route={{ key: 'Home', name: 'Home' } as never} />
    );

    fireEvent.press(screen.getByLabelText('掃描'));

    expect(track).toHaveBeenCalledWith('home_click_scan');
    expect(navigation.navigate).toHaveBeenCalledWith('BarcodeScanner');
  });

  it('tracks typing and clears the ISBN input', () => {
    const navigation = {
      navigate: jest.fn(),
    };

    const screen = renderWithProviders(
      <HomeScreen navigation={navigation as never} route={{ key: 'Home', name: 'Home' } as never} />
    );

    fireEvent.changeText(screen.getByPlaceholderText('ISBN 碼'), '9781402894626');
    fireEvent.press(screen.getByLabelText('清除'));

    expect(track).toHaveBeenCalledWith('home_type_isbn');
    expect(screen.getByPlaceholderText('ISBN 碼').props.value).toBe('');
  });

  it('tracks typing and clears the title input', () => {
    const navigation = {
      navigate: jest.fn(),
    };

    const screen = renderWithProviders(
      <HomeScreen navigation={navigation as never} route={{ key: 'Home', name: 'Home' } as never} />
    );

    fireEvent.press(screen.getByText('書名'));
    fireEvent.changeText(screen.getByPlaceholderText('輸入書名'), '設計中的書');
    fireEvent.press(screen.getByLabelText('清除'));

    expect(track).toHaveBeenCalledWith('home_change_mode', { mode: 'title' });
    expect(track).toHaveBeenCalledWith('home_type_title');
    expect(screen.getByPlaceholderText('輸入書名').props.value).toBe('');
  });

  it('does not search when the current input is invalid', () => {
    const navigation = {
      navigate: jest.fn(),
    };

    const screen = renderWithProviders(
      <HomeScreen navigation={navigation as never} route={{ key: 'Home', name: 'Home' } as never} />
    );

    fireEvent.changeText(screen.getByPlaceholderText('ISBN 碼'), '123');
    fireEvent.press(screen.getByText('搜尋好書價'));

    expect(navigation.navigate).not.toHaveBeenCalled();
    expect(track).not.toHaveBeenCalledWith('home_click_search', expect.anything());
  });

  it('switches input keyboard mode when toggling search type while focused', () => {
    const navigation = {
      navigate: jest.fn(),
    };

    const screen = renderWithProviders(
      <HomeScreen navigation={navigation as never} route={{ key: 'Home', name: 'Home' } as never} />
    );

    const isbnInput = screen.getByPlaceholderText('ISBN 碼');
    fireEvent(isbnInput, 'focus');

    expect(isbnInput.props.inputMode).toBe('numeric');
    expect(isbnInput.props.keyboardType).toBe('numeric');

    fireEvent.press(screen.getByText('書名'));

    const titleInput = screen.getByPlaceholderText('輸入書名');
    expect(titleInput.props.autoFocus).toBe(true);
    expect(titleInput.props.inputMode).toBe('text');
    expect(titleInput.props.keyboardType).toBe('default');

    fireEvent(titleInput, 'focus');
    fireEvent.press(screen.getByText('ISBN 碼'));

    const nextIsbnInput = screen.getByPlaceholderText('ISBN 碼');
    expect(nextIsbnInput.props.autoFocus).toBe(true);
    expect(nextIsbnInput.props.inputMode).toBe('numeric');
    expect(nextIsbnInput.props.keyboardType).toBe('numeric');
  });

  it('does not autofocus the next field after the current one blurs', () => {
    const navigation = {
      navigate: jest.fn(),
    };

    const screen = renderWithProviders(
      <HomeScreen navigation={navigation as never} route={{ key: 'Home', name: 'Home' } as never} />
    );

    const isbnInput = screen.getByPlaceholderText('ISBN 碼');
    fireEvent(isbnInput, 'focus');
    fireEvent(isbnInput, 'blur');
    fireEvent.press(screen.getByText('書名'));

    const titleInput = screen.getByPlaceholderText('輸入書名');
    expect(titleInput.props.autoFocus).toBe(false);

    fireEvent(titleInput, 'focus');
    fireEvent(titleInput, 'blur');
    fireEvent.press(screen.getByText('ISBN 碼'));

    const nextIsbnInput = screen.getByPlaceholderText('ISBN 碼');
    expect(nextIsbnInput.props.autoFocus).toBe(false);
  });
});
