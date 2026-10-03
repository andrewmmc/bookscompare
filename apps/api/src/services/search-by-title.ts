import {
  clusterOffersIntoBooks,
  clusterToBookDetail,
  normalizeForClusterKey,
} from '../lib/cluster';
import { createSearchResponse } from '../lib/responses';
import { runProviderSearch } from './provider-fanout';

import type { SearchResponse } from '@bookscompare/contracts';

function lowestOfferPrice(book: ReturnType<typeof clusterToBookDetail>): number {
  return book.offers[0]?.price ?? Number.POSITIVE_INFINITY;
}

function titleRelevance(book: ReturnType<typeof clusterToBookDetail>, query: string): number {
  const normalizedQuery = normalizeForClusterKey(query);
  const normalizedTitles = book.offers.map((offer) => normalizeForClusterKey(offer.title));

  if (normalizedTitles.some((title) => title === normalizedQuery)) {
    return 0;
  }

  if (normalizedTitles.some((title) => title.includes(normalizedQuery))) {
    return 1;
  }

  if (normalizedTitles.some((title) => normalizedQuery.includes(title))) {
    return 2;
  }

  return Number.POSITIVE_INFINITY;
}

export async function searchBooksByTitle(title: string): Promise<SearchResponse> {
  const fanout = await runProviderSearch({
    method: 'searchByTitle',
    value: title,
    failureMessage: 'One or more providers failed during title search.',
    emptyMessage: (providerName) => `No ${providerName} search results matched this title.`,
  });

  const clusters = clusterOffersIntoBooks(fanout.offers);
  const books = clusters
    .map(clusterToBookDetail)
    .map((book) => ({
      book,
      relevance: titleRelevance(book, title),
      price: lowestOfferPrice(book),
    }))
    .filter((entry) => Number.isFinite(entry.relevance))
    .sort((left, right) => {
      if (left.relevance !== right.relevance) {
        return left.relevance - right.relevance;
      }

      if (left.price !== right.price) {
        return left.price - right.price;
      }

      return right.book.offers.length - left.book.offers.length;
    })
    .map((entry) => entry.book);

  return createSearchResponse({
    query: { title },
    books,
    sources: fanout.sources,
    liveScraping: fanout.liveScraping,
    ...(fanout.message ? { message: fanout.message } : {}),
  });
}
