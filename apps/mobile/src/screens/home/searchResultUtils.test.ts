import {
  allSourcesErrored,
  extractOffers,
  filterOffers,
  isEbookOffer,
  sortOffers,
} from './searchResultUtils';

import type { BookOffer } from '@bookscompare/contracts';

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

describe('searchResultUtils', () => {
  it('detects ebook offers from product type or title', () => {
    expect(isEbookOffer(createOffer({ productType: '中文電子書' }))).toBe(true);
    expect(isEbookOffer(createOffer({ title: '設計中的書（電子書）' }))).toBe(true);
    expect(isEbookOffer(createOffer())).toBe(false);
  });

  it('extracts offers from ISBN and title payloads', () => {
    expect(
      extractOffers({
        query: { isbn: '9781402894626' },
        book: {
          id: '9781402894626',
          isbn: '9781402894626',
          title: '設計中的書',
          authors: ['作者甲'],
          publisher: '測試出版社',
          imageUrl: 'https://example.com/book.jpg',
          summary: '內容簡介',
          offers: [createOffer()],
        },
        sources: [],
        meta: { liveScraping: true, requestedAt: 'now' },
      })
    ).toHaveLength(1);

    expect(
      extractOffers({
        query: { title: '設計' },
        books: [],
        sources: [],
        meta: { liveScraping: true, requestedAt: 'now' },
      })
    ).toEqual([]);

    expect(extractOffers(undefined)).toEqual([]);
  });

  it('filters by preferred stores and book types', () => {
    const offers = [
      createOffer(),
      createOffer({ sourceId: 'eslite', sourceProductId: 'item-2', productType: '中文電子書' }),
    ];

    expect(filterOffers(offers, new Set(['eslite']), []).map((offer) => offer.sourceId)).toEqual([
      'eslite',
    ]);
    expect(filterOffers(offers, new Set(), ['physical']).map((offer) => offer.sourceId)).toEqual([
      'books-com-tw',
    ]);
  });

  it('sorts by price, store preference, and book type', () => {
    const cheaperEslite = createOffer({
      sourceId: 'eslite',
      sourceProductId: 'cheap',
      price: 200,
    });
    const ebook = createOffer({ sourceProductId: 'ebook', productType: '電子書', price: 150 });
    const offers = [createOffer({ price: 280 }), cheaperEslite, ebook];

    expect(sortOffers(offers, 'price', []).map((offer) => offer.sourceProductId)).toEqual([
      'ebook',
      'cheap',
      'item-1',
    ]);
    expect(sortOffers(offers, 'store', ['eslite']).map((offer) => offer.sourceId)[0]).toBe('eslite');
    expect(sortOffers(offers, 'physical', [])[0]?.productType).toBe('紙本書');
    expect(sortOffers(offers, 'ebook', [])[0]?.productType).toBe('電子書');
  });

  it('reports when every source errored', () => {
    expect(allSourcesErrored([])).toBe(false);
    expect(
      allSourcesErrored([
        { id: 'books-com-tw', name: '博客來', status: 'error' },
        { id: 'eslite', name: '誠品線上', status: 'error' },
      ])
    ).toBe(true);
  });
});
