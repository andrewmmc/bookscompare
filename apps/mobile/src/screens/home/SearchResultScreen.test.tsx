import { fireEvent } from '@testing-library/react-native';

import { SearchResultScreen } from './SearchResultScreen';
import { renderWithProviders } from '../../test/test-utils';

const mockUseTitleSearch = jest.fn();
const mockUseIsbnLookup = jest.fn();
const mockAddHistoryEntryMutate = jest.fn();

jest.mock('../../api/queries', () => ({
  useIsbnLookup: (...args: unknown[]) => mockUseIsbnLookup(...args),
  useTitleSearch: (...args: unknown[]) => mockUseTitleSearch(...args),
}));

jest.mock('../../api/favourites', () => ({
  useFavourites: () => ({ data: [], isLoading: false }),
  useIsFavourite: () => false,
  useAddFavourite: () => ({ mutate: jest.fn() }),
  useRemoveFavourite: () => ({ mutate: jest.fn() }),
}));

jest.mock('../../api/history', () => ({
  useAddHistoryEntry: () => ({ mutate: mockAddHistoryEntryMutate }),
}));

describe('SearchResultScreen', () => {
  beforeEach(() => {
    mockUseIsbnLookup.mockReset();
    mockUseTitleSearch.mockReset();
    mockAddHistoryEntryMutate.mockReset();
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

  it('renders ISBN offers and opens the selected store', () => {
    mockUseIsbnLookup.mockReturnValue({
      data: {
        query: { isbn: '9781402894626' },
        book: {
          id: '9781402894626',
          isbn: '9781402894626',
          title: '設計中的書',
          authors: ['作者甲'],
          publisher: '測試出版社',
          imageUrl: 'https://example.com/book.jpg',
          summary: '內容簡介',
          offers: [
            {
              sourceId: 'books-com-tw',
              sourceName: '博客來',
              sourceProductId: 'item-1',
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
            },
          ],
        },
        sources: [{ id: 'books-com-tw', name: '博客來', status: 'ready' }],
        meta: { liveScraping: true, requestedAt: 'now' },
      },
      error: null,
      isLoading: false,
      isRefetching: false,
      refetch: jest.fn(),
    });

    const navigation = { navigate: jest.fn(), setOptions: jest.fn() };

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

  it('renders title-search offers and opens the selected store', () => {
    mockUseTitleSearch.mockReturnValue({
      data: {
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
            offers: [
              {
                sourceId: 'books-com-tw',
                sourceName: '博客來',
                sourceProductId: 'item-1',
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
              },
              {
                sourceId: 'eslite',
                sourceName: '誠品線上',
                sourceProductId: 'item-2',
                title: '設計中的書',
                productType: '中文電子書',
                authors: ['作者甲'],
                publisher: '測試出版社',
                summary: '內容簡介',
                imageUrl: 'https://example.com/book.jpg',
                price: 320,
                currency: 'TWD',
                priceText: '320',
                url: 'https://example.com/store/book-eslite',
                badges: [],
              },
            ],
          },
        ],
        sources: [{ id: 'books-com-tw', name: '博客來', status: 'ready' }],
        meta: { liveScraping: true, requestedAt: 'now' },
      },
      error: null,
      isLoading: false,
      isRefetching: false,
      refetch: jest.fn(),
    });

    const navigation = { navigate: jest.fn(), setOptions: jest.fn() };

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

    expect(navigation.navigate).toHaveBeenCalledWith('SearchWebView', {
      title: '誠品線上 - 設計中的書',
      url: 'https://example.com/store/book-eslite',
      showOptions: true,
    });
  });

  it('renders an empty state when title results have no offers', () => {
    mockUseTitleSearch.mockReturnValue({
      data: {
        query: { title: '設計' },
        books: [
          {
            id: 't-設計中的書|作者甲',
            title: '設計中的書',
            authors: ['作者甲'],
            imageUrl: 'https://example.com/book.jpg',
            summary: '內容簡介',
            offers: [],
          },
        ],
        sources: [{ id: 'books-com-tw', name: '博客來', status: 'ready' }],
        meta: { liveScraping: true, requestedAt: 'now' },
      },
      error: null,
      isLoading: false,
      isRefetching: false,
      refetch: jest.fn(),
    });

    const navigation = { navigate: jest.fn(), setOptions: jest.fn() };

    const screen = renderWithProviders(
      <SearchResultScreen
        navigation={navigation as never}
        route={{ key: 'SearchResult', name: 'SearchResult', params: { title: '設計' } } as never}
      />
    );

    expect(screen.getByText('未能找到結果')).toBeOnTheScreen();
    expect(navigation.navigate).not.toHaveBeenCalled();
  });
});
