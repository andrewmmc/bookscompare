import { fireEvent } from '@testing-library/react-native';

import { SearchResultScreen } from './SearchResultScreen';
import { renderWithProviders } from '../../test/test-utils';

const mockUseTitleSearch = jest.fn();

jest.mock('../../api/queries', () => ({
  useTitleSearch: (...args: unknown[]) => mockUseTitleSearch(...args),
}));

describe('SearchResultScreen', () => {
  beforeEach(() => {
    mockUseTitleSearch.mockReset();
  });

  it('renders book summaries and navigates to BookDetail by ISBN when available', () => {
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
            lowestPrice: 280,
            currency: 'TWD',
            offerCount: 2,
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

    const navigation = { navigate: jest.fn() };

    const screen = renderWithProviders(
      <SearchResultScreen
        navigation={navigation as never}
        route={{ key: 'SearchResult', name: 'SearchResult', params: { title: '設計' } } as never}
      />
    );

    fireEvent.press(screen.getByText('設計中的書'));

    expect(navigation.navigate).toHaveBeenCalledWith('BookDetail', { isbn: '9781402894626' });
  });

  it('falls back to title + author navigation when ISBN is unavailable', () => {
    mockUseTitleSearch.mockReturnValue({
      data: {
        query: { title: '設計' },
        books: [
          {
            id: 't-設計中的書|作者甲',
            title: '設計中的書',
            authors: ['作者甲'],
            imageUrl: 'https://example.com/book.jpg',
            currency: 'TWD',
            offerCount: 1,
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

    const navigation = { navigate: jest.fn() };

    const screen = renderWithProviders(
      <SearchResultScreen
        navigation={navigation as never}
        route={{ key: 'SearchResult', name: 'SearchResult', params: { title: '設計' } } as never}
      />
    );

    fireEvent.press(screen.getByText('設計中的書'));

    expect(navigation.navigate).toHaveBeenCalledWith('BookDetail', {
      title: '設計中的書',
      author: '作者甲',
    });
  });
});
