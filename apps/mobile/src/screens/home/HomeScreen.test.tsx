import { fireEvent } from '@testing-library/react-native';

import { HomeScreen } from './HomeScreen';
import { renderWithProviders } from '../../test/test-utils';

describe('HomeScreen', () => {
  it('does not show title search when the feature flag is disabled', () => {
    const navigation = {
      navigate: jest.fn(),
    };

    const screen = renderWithProviders(
      <HomeScreen navigation={navigation as never} route={{ key: 'Home', name: 'Home' } as never} />
    );

    expect(screen.queryByText('書名')).toBeNull();
    expect(
      screen.getByText('掃描或輸入書本的國際標準書號 (ISBN 碼)，輕鬆找到最心儀的價格！')
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
});
