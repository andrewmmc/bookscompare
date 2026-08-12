import { clusterOffersIntoBooks, clusterToBookDetail } from '../lib/cluster';
import { createBookDetailResponse } from '../lib/responses';
import { runProviderSearch } from './provider-fanout';

import { canonicalizeIsbn, type BookDetailResponse } from '@bookscompare/contracts';

function isCompatibleWithIsbn(offerIsbn: string | undefined, isbn: string): boolean {
  return !offerIsbn || canonicalizeIsbn(offerIsbn) === canonicalizeIsbn(isbn);
}

function selectIsbnCluster(
  clusters: ReturnType<typeof clusterOffersIntoBooks>,
  isbn: string
): ReturnType<typeof clusterOffersIntoBooks>[number] | undefined {
  const canonicalIsbn = canonicalizeIsbn(isbn);
  const identified = clusters.find((entry) => entry.isbn === canonicalIsbn);
  if (identified) {
    return identified;
  }

  // Provider title searches sometimes omit ISBNs. Accept those offers only when
  // they all describe a single unambiguous title/author cluster.
  return clusters.length === 1 ? clusters[0] : undefined;
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
  const cluster = selectIsbnCluster(clusters, isbn);
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
