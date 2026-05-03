import { clusterOffersIntoBooks, clusterToBookSummary } from '../lib/cluster';
import { createSearchResponse } from '../lib/responses';
import { runProviderSearch } from './provider-fanout';

import type { SearchResponse } from '@bookscompare/contracts';

export async function searchBooksByTitle(title: string): Promise<SearchResponse> {
  const fanout = await runProviderSearch({
    method: 'searchByTitle',
    value: title,
    failureMessage: 'One or more providers failed during title search.',
    emptyMessage: (providerName) => `No ${providerName} search results matched this title.`,
  });

  const clusters = clusterOffersIntoBooks(fanout.offers);
  const books = clusters.map(clusterToBookSummary).sort((left, right) => {
    const leftPrice = left.lowestPrice ?? Number.POSITIVE_INFINITY;
    const rightPrice = right.lowestPrice ?? Number.POSITIVE_INFINITY;

    if (leftPrice !== rightPrice) {
      return leftPrice - rightPrice;
    }

    return right.offerCount - left.offerCount;
  });

  return createSearchResponse({
    query: { title },
    books,
    sources: fanout.sources,
    liveScraping: fanout.liveScraping,
    ...(fanout.message ? { message: fanout.message } : {}),
  });
}
