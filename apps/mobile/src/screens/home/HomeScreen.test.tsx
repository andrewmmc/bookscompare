import { fireEvent } from '@testing-library/react-native';

import { HomeScreen } from './HomeScreen';
import { renderWithProviders } from '../../test/test-utils';

describe('HomeScreen', () => {
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
  });
});
