import { clusterOffersIntoBooks, clusterToBookDetail } from '../lib/cluster';
import { createBookDetailResponse } from '../lib/responses';
import { runProviderSearch } from './provider-fanout';

import { normalizeIsbn, type BookDetailResponse } from '@bookscompare/contracts';

function isCompatibleWithIsbn(offerIsbn: string | undefined, isbn: string): boolean {
  return !offerIsbn || normalizeIsbn(offerIsbn) === isbn;
}

export async function searchBooksByIsbn(isbn: string): Promise<BookDetailResponse> {
  const fanout = await runProviderSearch({
    method: 'searchByIsbn',
    value: isbn,
    failureMessage: 'One or more providers failed during ISBN search.',
    emptyMessage: (providerName) => `No ${providerName} search results matched this ISBN.`,
  });

  const offers = fanout.offers.filter((offer) => isCompatibleWithIsbn(offer.isbn, isbn));
  const clusters = clusterOffersIntoBooks(offers);
  const cluster =
    clusters.find((entry) => entry.isbn === isbn) ??
    clusters.sort((left, right) => right.offers.length - left.offers.length)[0];
  const detail = cluster ? clusterToBookDetail(cluster) : null;
  const book = detail ? { ...detail, id: isbn, isbn } : null;

  return createBookDetailResponse({
    query: { isbn },
    book,
    sources: fanout.sources,
    liveScraping: fanout.liveScraping,
    ...(fanout.message ? { message: fanout.message } : {}),
  });
}
