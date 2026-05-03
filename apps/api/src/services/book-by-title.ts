import {
  clusterOffersIntoBooks,
  clusterToBookDetail,
  findClusterByTitleAuthor,
} from '../lib/cluster';
import { createBookDetailResponse } from '../lib/responses';
import { runProviderSearch } from './provider-fanout';

import type { BookDetailResponse } from '@bookscompare/contracts';

interface LookupBookByTitleAuthorInput {
  title: string;
  author?: string;
}

export async function lookupBookByTitleAuthor({
  title,
  author,
}: LookupBookByTitleAuthorInput): Promise<BookDetailResponse> {
  const fanout = await runProviderSearch({
    method: 'searchByTitle',
    value: title,
    failureMessage: 'One or more providers failed during title search.',
    emptyMessage: (providerName) => `No ${providerName} search results matched this title.`,
  });

  const clusters = clusterOffersIntoBooks(fanout.offers);
  const cluster = findClusterByTitleAuthor(clusters, title, author);
  const book = cluster ? clusterToBookDetail(cluster) : null;

  return createBookDetailResponse({
    query: author ? { title, author } : { title },
    book,
    sources: fanout.sources,
    liveScraping: fanout.liveScraping,
    ...(fanout.message ? { message: fanout.message } : {}),
  });
}
