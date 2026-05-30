import { FlatList } from 'react-native';
import { fireEvent } from '@testing-library/react-native';

import { SearchResultScreen } from './SearchResultScreen';
import { track } from '../../analytics';
import { openExternalUrl } from '../../lib/linking';
import { renderWithProviders } from '../../test/test-utils';

import type { ReactNode } from 'react';
import type { BookOffer } from '@bookscompare/contracts';
import type { Preferences } from '../../lib/preferences';

const mockUseTitleSearch = jest.fn();
const mockUseIsbnLookup = jest.fn();
const mockUseFavourites = jest.fn();
const mockUseIsFavourite = jest.fn();
const mockAddFavouriteMutate = jest.fn();
const mockRemoveFavouriteMutate = jest.fn();
const mockAddHistoryEntryMutate = jest.fn();
const mockGetPreferences = jest.fn<Preferences, []>(() => ({
  openLinksIn: 'app',
  themeMode: 'system',
  preferredSources: [],
  preferredBookTypes: [],
}));

jest.mock('../../analytics', () => ({
  track: jest.fn(),
}));

jest.mock('../../lib/linking', () => ({
  openExternalUrl: jest.fn(),
}));

jest.mock('../../api/queries', () => ({
  useIsbnLookup: (...args: unknown[]) => mockUseIsbnLookup(...args),
  useTitleSearch: (...args: unknown[]) => mockUseTitleSearch(...args),
}));

jest.mock('../../api/favourites', () => ({
  useFavourites: (...args: unknown[]) => mockUseFavourites(...args),
  useIsFavourite: (...args: unknown[]) => mockUseIsFavourite(...args),
  useAddFavourite: () => ({ mutate: mockAddFavouriteMutate }),
  useRemoveFavourite: () => ({ mutate: mockRemoveFavouriteMutate }),
}));

jest.mock('../../api/history', () => ({
  useAddHistoryEntry: () => ({ mutate: mockAddHistoryEntryMutate }),
}));

jest.mock('../../lib/preferences', () => ({
  usePreferences: () => mockGetPreferences(),
}));

function createOffer(overrides: Partial<BookOffer> = {}): BookOffer {
  return {
    sourceId: 'books-com-tw',
    sourceName: '博客來',
    sourceProductId: 'item-1',
    isbn: '9781402894626',
    title: '設計中的書',
    productType: '紙本書',
    authors: ['作者甲'],
    publisher: '測試出版社',
    summary: '內容簡介',
    imageUrl: 'https://example.com/book.jpg',
    price: 280,
    currency: 'TWD',
    priceText: '280',
    url: 'https://example.com/store/book',
    badges: [],
    ...overrides,
  };
}

function createIsbnData(offers: BookOffer[] = [createOffer()]) {
  return {
    query: { isbn: '9781402894626' },
    book: {
      id: '9781402894626',
      isbn: '9781402894626',
      title: '設計中的書',
      authors: ['作者甲'],
      publisher: '測試出版社',
      imageUrl: 'https://example.com/book.jpg',
      summary: '內容簡介',
      offers,
    },
    sources: [{ id: 'books-com-tw', name: '博客來', status: 'ready' as const }],
    meta: { liveScraping: true, requestedAt: 'now' },
  };
}

function createTitleData(
  offers: BookOffer[] = [createOffer()],
  options: {
    sources?: Array<{
      id: string;
      name: string;
      status: 'ready' | 'error' | 'disabled';
      message?: string;
    }>;
    liveScraping?: boolean;
  } = {}
) {
  return {
    query: { title: '設計' },
    books: [
      {
        id: '9781402894626',
        isbn: '9781402894626',
        title: '設計中的書',
        authors: ['作者甲'],
        publisher: '測試出版社',
        imageUrl: 'https://example.com/book.jpg',
        summary: '內容簡介',
        offers,
      },
    ],
    sources: options.sources ?? [{ id: 'books-com-tw', name: '博客來', status: 'ready' as const }],
    meta: { liveScraping: options.liveScraping ?? true, requestedAt: 'now' },
  };
}

function createNavigation() {
  return { navigate: jest.fn(), setOptions: jest.fn() };
}

describe('SearchResultScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseIsbnLookup.mockReset();
    mockUseTitleSearch.mockReset();
    mockUseFavourites.mockReset();
    mockUseIsFavourite.mockReset();
    mockAddFavouriteMutate.mockReset();
    mockRemoveFavouriteMutate.mockReset();
    mockAddHistoryEntryMutate.mockReset();
    mockGetPreferences.mockReturnValue({
      openLinksIn: 'app',
      themeMode: 'system',
      preferredSources: [],
      preferredBookTypes: [],
    });
    mockUseFavourites.mockReturnValue({ data: [], isLoading: false });
    mockUseIsFavourite.mockReturnValue(false);
    mockUseIsbnLookup.mockReturnValue({
      data: undefined,
      error: null,
      isLoading: false,
      isRefetching: false,
      refetch: jest.fn(),
    });
    mockUseTitleSearch.mockReturnValue({
      data: undefined,
      error: null,
      isLoading: false,
      isRefetching: false,
      refetch: jest.fn(),
    });
  });

  it('renders ISBN offers and opens the selected store in-app', () => {
    mockUseIsbnLookup.mockReturnValue({
      data: createIsbnData(),
      error: null,
      isLoading: false,
      isRefetching: false,
      refetch: jest.fn(),
    });

    const navigation = createNavigation();
    const screen = renderWithProviders(
      <SearchResultScreen
        navigation={navigation as never}
        route={
          { key: 'SearchResult', name: 'SearchResult', params: { isbn: '9781402894626' } } as never
        }
      />
    );

    fireEvent.press(screen.getByText('博客來: 設計中的書'));

    expect(mockUseIsbnLookup).toHaveBeenCalledWith('9781402894626');
    expect(navigation.navigate).toHaveBeenCalledWith('SearchWebView', {
      title: '博客來 - 設計中的書',
      url: 'https://example.com/store/book',
      showOptions: true,
    });
  });

  it('renders title-search offers, records history, and opens the selected store', () => {
    mockUseTitleSearch.mockReturnValue({
      data: createTitleData([
        createOffer(),
        createOffer({
          sourceId: 'eslite',
          sourceName: '誠品線上',
          sourceProductId: 'item-2',
          productType: '中文電子書',
          price: 320,
          priceText: '320',
          url: 'https://example.com/store/book-eslite',
        }),
      ]),
      error: null,
      isLoading: false,
      isRefetching: false,
      refetch: jest.fn(),
    });

    const navigation = createNavigation();
    const screen = renderWithProviders(
      <SearchResultScreen
        navigation={navigation as never}
        route={{ key: 'SearchResult', name: 'SearchResult', params: { title: '設計' } } as never}
      />
    );

    expect(screen.getByText('博客來: 設計中的書')).toBeOnTheScreen();
    expect(screen.getByText('誠品線上: 設計中的書')).toBeOnTheScreen();
    expect(screen.getByText('電子書')).toBeOnTheScreen();

    fireEvent.press(screen.getByText('誠品線上: 設計中的書'));

    expect(mockAddHistoryEntryMutate).toHaveBeenCalledWith({ type: 'title', title: '設計' });
    expect(navigation.navigate).toHaveBeenCalledWith('SearchWebView', {
      title: '誠品線上 - 設計中的書',
      url: 'https://example.com/store/book-eslite',
      showOptions: true,
    });
  });

  it('shows a loading overlay while waiting for results', () => {
    mockUseTitleSearch.mockReturnValue({
      data: undefined,
      error: null,
      isLoading: true,
      isRefetching: false,
      refetch: jest.fn(),
    });

    const navigation = createNavigation();
    const screen = renderWithProviders(
      <SearchResultScreen
        navigation={navigation as never}
        route={{ key: 'SearchResult', name: 'SearchResult', params: { title: '設計' } } as never}
      />
    );

    expect(screen.getByText('正在比對最新書價…')).toBeOnTheScreen();
    expect(track).not.toHaveBeenCalledWith('search_result_error', expect.anything());
  });

  it('shows a network error state and retries', () => {
    const refetch = jest.fn();
    mockUseTitleSearch.mockReturnValue({
      data: undefined,
      error: new Error('network'),
      isLoading: false,
      isRefetching: false,
      refetch,
    });

    const navigation = createNavigation();
    const screen = renderWithProviders(
      <SearchResultScreen
        navigation={navigation as never}
        route={{ key: 'SearchResult', name: 'SearchResult', params: { title: '設計' } } as never}
      />
    );

    expect(screen.getByText('未能載入內容')).toBeOnTheScreen();

    fireEvent.press(screen.getByText('重新載入'));

    expect(track).toHaveBeenCalledWith('search_result_error', { searchType: 'title' });
    expect(refetch).toHaveBeenCalled();
  });

  it('shows an all-sources-errored empty state and retries', () => {
    const refetch = jest.fn();
    mockUseTitleSearch.mockReturnValue({
      data: createTitleData([], {
        sources: [{ id: 'books-com-tw', name: '博客來', status: 'error', message: 'offline' }],
      }),
      error: null,
      isLoading: false,
      isRefetching: false,
      refetch,
    });

    const navigation = createNavigation();
    const screen = renderWithProviders(
      <SearchResultScreen
        navigation={navigation as never}
        route={{ key: 'SearchResult', name: 'SearchResult', params: { title: '設計' } } as never}
      />
    );

    expect(screen.getByText('書店暫時無法回應')).toBeOnTheScreen();

    fireEvent.press(screen.getByText('重新載入'));

    expect(track).toHaveBeenCalledWith('search_result_empty', { searchType: 'title' });
    expect(refetch).toHaveBeenCalled();
  });

  it('shows a not-live empty state and retries', () => {
    const refetch = jest.fn();
    mockUseTitleSearch.mockReturnValue({
      data: createTitleData([], { liveScraping: false }),
      error: null,
      isLoading: false,
      isRefetching: false,
      refetch,
    });

    const navigation = createNavigation();
    const screen = renderWithProviders(
      <SearchResultScreen
        navigation={navigation as never}
        route={{ key: 'SearchResult', name: 'SearchResult', params: { title: '設計' } } as never}
      />
    );

    expect(screen.getByText('即時搜尋尚未啟用')).toBeOnTheScreen();

    fireEvent.press(screen.getByText('重新載入'));

    expect(refetch).toHaveBeenCalled();
  });

  it('renders an empty state when title results have no offers', () => {
    mockUseTitleSearch.mockReturnValue({
      data: createTitleData([]),
      error: null,
      isLoading: false,
      isRefetching: false,
      refetch: jest.fn(),
    });

    const navigation = createNavigation();
    const screen = renderWithProviders(
      <SearchResultScreen
        navigation={navigation as never}
        route={{ key: 'SearchResult', name: 'SearchResult', params: { title: '設計' } } as never}
      />
    );

    expect(screen.getByText('未能找到結果')).toBeOnTheScreen();
    expect(navigation.navigate).not.toHaveBeenCalled();
  });

  it('filters title-search offers by preferred book type', () => {
    mockGetPreferences.mockReturnValue({
      openLinksIn: 'app',
      themeMode: 'system',
      preferredSources: [],
      preferredBookTypes: ['physical'],
    });
    mockUseTitleSearch.mockReturnValue({
      data: createTitleData([
        createOffer({ productType: '中文書' }),
        createOffer({
          sourceId: 'eslite',
          sourceName: '誠品線上',
          sourceProductId: 'item-2',
          productType: '中文電子書',
          price: 320,
          priceText: '320',
          url: 'https://example.com/store/book-eslite',
        }),
      ]),
      error: null,
      isLoading: false,
      isRefetching: false,
      refetch: jest.fn(),
    });

    const navigation = createNavigation();
    const screen = renderWithProviders(
      <SearchResultScreen
        navigation={navigation as never}
        route={{ key: 'SearchResult', name: 'SearchResult', params: { title: '設計' } } as never}
      />
    );

    expect(screen.getByText('博客來: 設計中的書')).toBeOnTheScreen();
    expect(screen.queryByText('誠品線上: 設計中的書')).toBeNull();
    expect(screen.queryByText('電子書')).toBeNull();
  });

  it('opens offers in the browser when that preference is selected', () => {
    mockGetPreferences.mockReturnValue({
      openLinksIn: 'browser',
      themeMode: 'system',
      preferredSources: [],
      preferredBookTypes: [],
    });
    mockUseTitleSearch.mockReturnValue({
      data: createTitleData([createOffer({ url: 'https://example.com/browser-book' })]),
      error: null,
      isLoading: false,
      isRefetching: false,
      refetch: jest.fn(),
    });

    const navigation = createNavigation();
    const screen = renderWithProviders(
      <SearchResultScreen
        navigation={navigation as never}
        route={{ key: 'SearchResult', name: 'SearchResult', params: { title: '設計' } } as never}
      />
    );

    fireEvent.press(screen.getByText('博客來: 設計中的書'));

    expect(openExternalUrl).toHaveBeenCalledWith('https://example.com/browser-book');
    expect(navigation.navigate).not.toHaveBeenCalled();
  });

  it('adds a row favourite from title results', () => {
    mockUseTitleSearch.mockReturnValue({
      data: createTitleData(),
      error: null,
      isLoading: false,
      isRefetching: false,
      refetch: jest.fn(),
    });

    const navigation = createNavigation();
    const screen = renderWithProviders(
      <SearchResultScreen
        navigation={navigation as never}
        route={{ key: 'SearchResult', name: 'SearchResult', params: { title: '設計' } } as never}
      />
    );

    fireEvent.press(screen.getByLabelText('加入收藏'));

    expect(track).toHaveBeenCalledWith('favourite_add', {
      isbn: '9781402894626',
      source: 'search_result_row',
    });
    expect(mockAddFavouriteMutate).toHaveBeenCalledWith({
      isbn: '9781402894626',
      title: '設計中的書',
    });
  });

  it('does not render a row favourite action when an offer has no isbn', () => {
    const offerWithoutIsbn = {
      ...createOffer({ sourceProductId: 'item-no-isbn', url: 'https://example.com/no-isbn' }),
      isbn: undefined,
    } as unknown as BookOffer;

    mockUseTitleSearch.mockReturnValue({
      data: createTitleData([offerWithoutIsbn]),
      error: null,
      isLoading: false,
      isRefetching: false,
      refetch: jest.fn(),
    });

    const navigation = createNavigation();
    const screen = renderWithProviders(
      <SearchResultScreen
        navigation={navigation as never}
        route={{ key: 'SearchResult', name: 'SearchResult', params: { title: '設計' } } as never}
      />
    );

    expect(screen.queryByLabelText('加入收藏')).toBeNull();
  });

  it('removes a row favourite from title results', () => {
    mockUseFavourites.mockReturnValue({
      data: [{ isbn: '9781402894626', title: '設計中的書', addedAt: 1000 }],
      isLoading: false,
    });
    mockUseTitleSearch.mockReturnValue({
      data: createTitleData(),
      error: null,
      isLoading: false,
      isRefetching: false,
      refetch: jest.fn(),
    });

    const navigation = createNavigation();
    const screen = renderWithProviders(
      <SearchResultScreen
        navigation={navigation as never}
        route={{ key: 'SearchResult', name: 'SearchResult', params: { title: '設計' } } as never}
      />
    );

    fireEvent.press(screen.getByLabelText('從收藏中移除'));

    expect(track).toHaveBeenCalledWith('favourite_remove', {
      isbn: '9781402894626',
      source: 'search_result_row',
    });
    expect(mockRemoveFavouriteMutate).toHaveBeenCalledWith('9781402894626');
  });

  it('adds the ISBN result to favourites from the header action', () => {
    mockUseIsbnLookup.mockReturnValue({
      data: createIsbnData(),
      error: null,
      isLoading: false,
      isRefetching: false,
      refetch: jest.fn(),
    });

    const navigation = createNavigation();
    renderWithProviders(
      <SearchResultScreen
        navigation={navigation as never}
        route={
          { key: 'SearchResult', name: 'SearchResult', params: { isbn: '9781402894626' } } as never
        }
      />
    );

    const headerRight = navigation.setOptions.mock.calls.at(-1)?.[0].headerRight as () => ReactNode;
    const header = renderWithProviders(<>{headerRight()}</>);

    fireEvent.press(header.getByLabelText('加入收藏'));

    expect(track).toHaveBeenCalledWith('favourite_add', {
      isbn: '9781402894626',
      source: 'search_result_header',
    });
    expect(mockAddFavouriteMutate).toHaveBeenCalledWith({
      isbn: '9781402894626',
      title: '設計中的書',
    });
  });

  it('removes the ISBN result from favourites from the header action', () => {
    mockUseIsFavourite.mockReturnValue(true);
    mockUseIsbnLookup.mockReturnValue({
      data: createIsbnData(),
      error: null,
      isLoading: false,
      isRefetching: false,
      refetch: jest.fn(),
    });

    const navigation = createNavigation();
    renderWithProviders(
      <SearchResultScreen
        navigation={navigation as never}
        route={
          { key: 'SearchResult', name: 'SearchResult', params: { isbn: '9781402894626' } } as never
        }
      />
    );

    const headerRight = navigation.setOptions.mock.calls.at(-1)?.[0].headerRight as () => ReactNode;
    const header = renderWithProviders(<>{headerRight()}</>);

    fireEvent.press(header.getByLabelText('從收藏中移除'));

    expect(track).toHaveBeenCalledWith('favourite_remove', {
      isbn: '9781402894626',
      source: 'search_result_header',
    });
    expect(mockRemoveFavouriteMutate).toHaveBeenCalledWith('9781402894626');
  });

  it('refreshes the list from pull-to-refresh props', () => {
    const refetch = jest.fn();
    mockUseTitleSearch.mockReturnValue({
      data: createTitleData(),
      error: null,
      isLoading: false,
      isRefetching: true,
      refetch,
    });

    const navigation = createNavigation();
    const screen = renderWithProviders(
      <SearchResultScreen
        navigation={navigation as never}
        route={{ key: 'SearchResult', name: 'SearchResult', params: { title: '設計' } } as never}
      />
    );

    const list = screen.UNSAFE_getByType(FlatList);
    expect(list.props.refreshing).toBe(true);

    list.props.onRefresh();

    expect(refetch).toHaveBeenCalled();
  });
});
