import { fireEvent } from '@testing-library/react-native';

import { FavouritesScreen } from './FavouritesScreen';
import { renderWithProviders } from '../../test/test-utils';

const mockUseFavourites = jest.fn();
const mockMutate = jest.fn();

jest.mock('../../api/favourites', () => ({
  useFavourites: (...args: unknown[]) => mockUseFavourites(...args),
  useRemoveFavourite: () => ({ mutate: mockMutate }),
}));

describe('FavouritesScreen', () => {
  beforeEach(() => {
    mockUseFavourites.mockReset();
    mockMutate.mockReset();
  });

  it('shows empty state when there are no favourites', () => {
    mockUseFavourites.mockReturnValue({ data: [], isLoading: false });

    const navigation = { navigate: jest.fn() };
    const screen = renderWithProviders(
      <FavouritesScreen
        navigation={navigation as never}
        route={{ key: 'Favourites', name: 'Favourites', params: undefined } as never}
      />
    );

    expect(screen.getByText('還沒有收藏任何書')).toBeOnTheScreen();
  });

  it('renders favourites and navigates to SearchResult on tap', () => {
    mockUseFavourites.mockReturnValue({
      data: [
        { isbn: '9789861336275', title: '我的最愛之書', addedAt: 2000 },
        { isbn: '9781402894626', title: '另一本書', addedAt: 1000 },
      ],
      isLoading: false,
    });

    const navigation = { navigate: jest.fn() };
    const screen = renderWithProviders(
      <FavouritesScreen
        navigation={navigation as never}
        route={{ key: 'Favourites', name: 'Favourites', params: undefined } as never}
      />
    );

    expect(screen.getByText('我的最愛之書')).toBeOnTheScreen();
    expect(screen.getByText('另一本書')).toBeOnTheScreen();
    expect(screen.getByText('9789861336275')).toBeOnTheScreen();

    fireEvent.press(screen.getByText('我的最愛之書'));
    expect(navigation.navigate).toHaveBeenCalledWith('SearchResult', {
      isbn: '9789861336275',
    });
  });
});
