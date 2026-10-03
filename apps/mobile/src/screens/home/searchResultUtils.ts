import { BOOK_SOURCES, type BookOffer, type BookSourceId } from '@bookscompare/contracts';

import type { BookDetailResponse, SearchResponse, SourceState } from '@bookscompare/contracts';
import type { BookTypePreference } from '../../lib/preferences';

export type SearchResultData = BookDetailResponse | SearchResponse;
export type ResultSortMode = 'price' | 'store' | 'physical' | 'ebook';

const defaultSourceOrder = BOOK_SOURCES.map((source) => source.id);

export function isEbookOffer(item: BookOffer): boolean {
  return item.productType.includes('電子書') || item.title.includes('電子書');
}

export function matchesBookTypePreference(
  item: BookOffer,
  preferredBookTypes: BookTypePreference[]
): boolean {
  if (preferredBookTypes.length === 0) {
    return true;
  }

  const isEbook = isEbookOffer(item);
  return preferredBookTypes.includes(isEbook ? 'ebook' : 'physical');
}

export function extractOffers(data: SearchResultData | undefined): BookOffer[] {
  if (!data) {
    return [];
  }

  if ('book' in data) {
    return data.book ? data.book.offers : [];
  }

  return data.books.flatMap((book) => book.offers);
}

export function filterOffers(
  offers: BookOffer[],
  preferredSources: ReadonlySet<BookSourceId>,
  preferredBookTypes: BookTypePreference[]
): BookOffer[] {
  return offers.filter(
    (offer) =>
      (preferredSources.size === 0 || preferredSources.has(offer.sourceId)) &&
      matchesBookTypePreference(offer, preferredBookTypes)
  );
}

export function compareByPrice(a: BookOffer, b: BookOffer): number {
  return a.price - b.price;
}

export function getSourceRank(sourceId: BookSourceId, preferredSources: BookSourceId[]): number {
  const preferredIndex = preferredSources.indexOf(sourceId);
  if (preferredIndex >= 0) {
    return preferredIndex;
  }

  const defaultIndex = defaultSourceOrder.indexOf(sourceId);
  return preferredSources.length + (defaultIndex >= 0 ? defaultIndex : defaultSourceOrder.length);
}

export function sortOffers(
  offers: BookOffer[],
  sortMode: ResultSortMode,
  preferredSources: BookSourceId[]
): BookOffer[] {
  return offers.slice().sort((a, b) => {
    switch (sortMode) {
      case 'store': {
        const sourceRank =
          getSourceRank(a.sourceId, preferredSources) - getSourceRank(b.sourceId, preferredSources);
        return sourceRank || compareByPrice(a, b);
      }
      case 'physical': {
        const bookTypeRank = Number(isEbookOffer(a)) - Number(isEbookOffer(b));
        return bookTypeRank || compareByPrice(a, b);
      }
      case 'ebook': {
        const bookTypeRank = Number(isEbookOffer(b)) - Number(isEbookOffer(a));
        return bookTypeRank || compareByPrice(a, b);
      }
      case 'price':
      default:
        return compareByPrice(a, b);
    }
  });
}

export function allSourcesErrored(sources: SourceState[]): boolean {
  return sources.length > 0 && sources.every((source) => source.status === 'error');
}
