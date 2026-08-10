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
    .filter((book) => Number.isFinite(titleRelevance(book, title)))
    .sort((left, right) => {
      const relevanceDifference = titleRelevance(left, title) - titleRelevance(right, title);

      if (relevanceDifference !== 0) {
        return relevanceDifference;
      }

      const leftPrice = lowestOfferPrice(left);
      const rightPrice = lowestOfferPrice(right);

      if (leftPrice !== rightPrice) {
        return leftPrice - rightPrice;
      }

      return right.offers.length - left.offers.length;
    });

  return createSearchResponse({
    query: { title },
    books,
    sources: fanout.sources,
    liveScraping: fanout.liveScraping,
    ...(fanout.message ? { message: fanout.message } : {}),
  });
}
