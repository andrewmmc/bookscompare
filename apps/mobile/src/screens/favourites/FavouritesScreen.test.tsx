import { fireEvent, waitFor } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { Alert, FlatList } from 'react-native';

import { FavouritesScreen } from './FavouritesScreen';
import { track } from '../../analytics';
import { renderWithProviders } from '../../test/test-utils';

const mockUseFavourites = jest.fn();
const mockMutate = jest.fn();
const mockRestoreMutate = jest.fn();
const mockClearMutate = jest.fn();
const mockShowActionSheet = jest.fn();

jest.mock('@expo/react-native-action-sheet', () => {
  const actual = jest.requireActual('@expo/react-native-action-sheet');
  return {
    ...actual,
    useActionSheet: () => ({ showActionSheetWithOptions: mockShowActionSheet }),
  };
});

jest.mock('../../analytics', () => ({
  track: jest.fn(),
}));

jest.mock('../../api/favourites', () => ({
  useFavourites: (...args: unknown[]) => mockUseFavourites(...args),
  useRemoveFavourite: () => ({ mutate: mockMutate }),
  useRestoreFavourite: () => ({ mutate: mockRestoreMutate }),
  useClearFavourites: () => ({ mutate: mockClearMutate }),
}));

describe('FavouritesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseFavourites.mockReset();
    mockMutate.mockReset();
    mockRestoreMutate.mockReset();
    mockClearMutate.mockReset();
    mockShowActionSheet.mockReset();
    mockMutate.mockImplementation((_isbn: string, options?: { onSuccess?: () => void }) =>
      options?.onSuccess?.()
    );
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
    expect(track).toHaveBeenCalledWith('favourites_open_book', { isbn: '9789861336275' });
  });

  it('sorts by time and changes direction from the header menu', async () => {
    mockUseFavourites.mockReturnValue({
      data: [
        { isbn: '1', title: '較舊', addedAt: 1000 },
        { isbn: '2', title: '較新', addedAt: 2000 },
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

    expect(
      screen.UNSAFE_getByType(FlatList).props.data.map((item: { title: string }) => item.title)
    ).toEqual(['較新', '較舊']);

    const headerRight = (navigation.setOptions as jest.Mock).mock.calls.at(-1)?.[0]
      ?.headerRight as () => ReactElement;
    const header = renderWithProviders(headerRight());
    mockShowActionSheet.mockImplementation(
      (_options: unknown, callback: (selectedIndex?: number) => void) => callback(1)
    );
    fireEvent.press(header.getByLabelText('排序'));

    expect(mockShowActionSheet).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '排序',
        options: ['✓ 最新優先', '最舊優先', '取消'],
        cancelButtonIndex: 2,
        userInterfaceStyle: 'light',
      }),
      expect.any(Function)
    );

    await waitFor(() =>
      expect(
        screen.UNSAFE_getByType(FlatList).props.data.map((item: { title: string }) => item.title)
      ).toEqual(['較舊', '較新'])
    );
  });

  it('removes one favourite without confirmation', () => {
    const favourite = { isbn: '9789861336275', title: '我的最愛之書', addedAt: 2000 };
    mockUseFavourites.mockReturnValue({ data: [favourite], isLoading: false });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const navigation = { navigate: jest.fn(), setOptions: jest.fn() };

    const screen = renderWithProviders(
      <FavouritesScreen
        navigation={navigation as never}
        route={{ key: 'Favourites', name: 'Favourites', params: undefined } as never}
      />
    );

    fireEvent.press(screen.getByLabelText('從收藏中移除'));

    expect(mockMutate).toHaveBeenCalledWith('9789861336275', expect.any(Object));
    expect(alertSpy).not.toHaveBeenCalled();
    expect(screen.getByText('已從收藏移除。搖動手機即可還原。')).toBeOnTheScreen();
    expect(navigation.setOptions).toHaveBeenCalledTimes(1);

    alertSpy.mockRestore();
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
    const header = renderWithProviders(headerNode!);
    expect(header.getByLabelText('排序')).toBeOnTheScreen();
    fireEvent.press(header.getByLabelText('全部清除'));

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
    expect(track).toHaveBeenCalledWith('favourites_click_clear_all');
    expect(track).toHaveBeenCalledWith('favourites_clear_all_confirm');

    alertSpy.mockRestore();
  });

  it('keeps sort and clear-all actions when there are no favourites', () => {
    mockUseFavourites.mockReturnValue({ data: [], isLoading: false });

    const navigation = { navigate: jest.fn(), setOptions: jest.fn() };
    renderWithProviders(
      <FavouritesScreen
        navigation={navigation as never}
        route={{ key: 'Favourites', name: 'Favourites', params: undefined } as never}
      />
    );

    const setOptions = navigation.setOptions as jest.Mock;
    const headerRight = setOptions.mock.calls.at(-1)?.[0]?.headerRight as
      | (() => ReactElement)
      | undefined;
    expect(headerRight).toBeDefined();
    const header = renderWithProviders(headerRight!());
    expect(header.getByLabelText('排序')).toBeOnTheScreen();
    expect(header.getByLabelText('全部清除')).toBeOnTheScreen();
  });
});
