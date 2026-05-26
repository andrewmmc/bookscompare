import { fireEvent } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { Alert } from 'react-native';

import { FavouritesScreen } from './FavouritesScreen';
import { renderWithProviders } from '../../test/test-utils';

const mockUseFavourites = jest.fn();
const mockMutate = jest.fn();
const mockClearMutate = jest.fn();

jest.mock('../../api/favourites', () => ({
  useFavourites: (...args: unknown[]) => mockUseFavourites(...args),
  useRemoveFavourite: () => ({ mutate: mockMutate }),
  useClearFavourites: () => ({ mutate: mockClearMutate }),
}));

describe('FavouritesScreen', () => {
  beforeEach(() => {
    mockUseFavourites.mockReset();
    mockMutate.mockReset();
    mockClearMutate.mockReset();
  });

  it('shows empty state when there are no favourites', () => {
    mockUseFavourites.mockReturnValue({ data: [], isLoading: false });

    const navigation = { navigate: jest.fn(), setOptions: jest.fn() };
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

    const navigation = { navigate: jest.fn(), setOptions: jest.fn() };
    const screen = renderWithProviders(
      <FavouritesScreen
        navigation={navigation as never}
        route={{ key: 'Favourites', name: 'Favourites', params: undefined } as never}
      />
    );

    expect(screen.getByText('我的最愛之書')).toBeOnTheScreen();
    expect(screen.getByText('另一本書')).toBeOnTheScreen();
    expect(screen.getByText('ISBN 9789861336275')).toBeOnTheScreen();

    fireEvent.press(screen.getByText('我的最愛之書'));
    expect(navigation.navigate).toHaveBeenCalledWith('SearchResult', {
      isbn: '9789861336275',
    });
  });

  it('confirms before clearing all favourites', () => {
    mockUseFavourites.mockReturnValue({
      data: [{ isbn: '9789861336275', title: '我的最愛之書', addedAt: 2000 }],
      isLoading: false,
    });

    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const navigation = { navigate: jest.fn(), setOptions: jest.fn() };
    renderWithProviders(
      <FavouritesScreen
        navigation={navigation as never}
        route={{ key: 'Favourites', name: 'Favourites', params: undefined } as never}
      />
    );

    const setOptions = navigation.setOptions as jest.Mock;
    const headerRight = setOptions.mock.calls.at(-1)?.[0]?.headerRight as
      | (() => ReactElement<{ onPress: () => void }> | null)
      | undefined;
    expect(headerRight).toBeDefined();
    const headerNode = headerRight!();
    expect(headerNode).not.toBeNull();
    headerNode!.props.onPress();

    expect(alertSpy).toHaveBeenCalledWith(
      '清除所有收藏？',
      '此動作無法復原，所有已收藏的書本都會被移除。',
      expect.any(Array)
    );

    const buttons = alertSpy.mock.calls[0]?.[2] as Array<{
      text: string;
      onPress?: () => void;
    }>;
    const confirm = buttons.find((b) => b.text === '全部清除');
    confirm?.onPress?.();
    expect(mockClearMutate).toHaveBeenCalled();

    alertSpy.mockRestore();
  });
});
