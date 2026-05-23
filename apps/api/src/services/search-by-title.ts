import { clusterOffersIntoBooks, clusterToBookDetail } from '../lib/cluster';
import { createSearchResponse } from '../lib/responses';
import { runProviderSearch } from './provider-fanout';

import type { SearchResponse } from '@bookscompare/contracts';

function lowestOfferPrice(book: ReturnType<typeof clusterToBookDetail>): number {
  return book.offers[0]?.price ?? Number.POSITIVE_INFINITY;
}

export async function searchBooksByTitle(title: string): Promise<SearchResponse> {
  const fanout = await runProviderSearch({
    method: 'searchByTitle',
    value: title,
    failureMessage: 'One or more providers failed during title search.',
    emptyMessage: (providerName) => `No ${providerName} search results matched this title.`,
  });

  const clusters = clusterOffersIntoBooks(fanout.offers);
  const books = clusters.map(clusterToBookDetail).sort((left, right) => {
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
