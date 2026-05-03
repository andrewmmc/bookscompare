import { fireEvent } from '@testing-library/react-native';

import { SearchResultScreen } from './SearchResultScreen';
import { renderWithProviders } from '../../test/test-utils';

const mockUseIsbnLookup = jest.fn();
const mockUseTitleSearch = jest.fn();

jest.mock('../../api/queries', () => ({
  useIsbnLookup: (...args: unknown[]) => mockUseIsbnLookup(...args),
  useTitleSearch: (...args: unknown[]) => mockUseTitleSearch(...args),
}));

describe('SearchResultScreen', () => {
  beforeEach(() => {
    mockUseTitleSearch.mockReturnValue({
      data: undefined,
      error: null,
      isLoading: false,
      isRefetching: false,
      refetch: jest.fn(),
    });
  });

  it('renders offers and opens the selected storefront page', () => {
    mockUseIsbnLookup.mockReturnValue({
      data: {
        data: [
          {
            sourceId: 'books-com-tw',
            sourceName: '博客來',
            sourceProductId: 'abc',
            title: '設計中的書',
            productType: 'book',
            authors: ['作者甲'],
            publisher: '測試出版社',
            summary: '',
            price: 300,
            currency: 'TWD',
            priceText: '300',
            url: 'https://example.com/book',
            imageUrl: 'https://example.com/book.jpg',
            badges: ['79 折'],
          },
        ],
        sources: [{ id: 'books-com-tw', name: '博客來', status: 'ready' }],
        meta: { liveScraping: true, requestedAt: 'now' },
        query: { isbn: '9781402894626' },
      },
      error: null,
      isLoading: false,
      isRefetching: false,
      refetch: jest.fn(),
    });

    const navigation = {
      navigate: jest.fn(),
    };

    const screen = renderWithProviders(
      <SearchResultScreen
        navigation={navigation as never}
        route={
          { key: 'SearchResult', name: 'SearchResult', params: { isbn: '9781402894626' } } as never
        }
      />
    );

    fireEvent.press(screen.getByText('博客來: 設計中的書'));

    expect(navigation.navigate).toHaveBeenCalledWith('SearchWebView', {
      title: '博客來 - 設計中的書',
      url: 'https://example.com/book',
      showOptions: true,
    });
  });
});
