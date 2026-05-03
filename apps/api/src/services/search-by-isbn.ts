import { clusterOffersIntoBooks, clusterToBookDetail } from '../lib/cluster';
import { createBookDetailResponse } from '../lib/responses';
import { runProviderSearch } from './provider-fanout';

import type { BookDetailResponse, BookOffer } from '@bookscompare/contracts';

function annotateOffersWithIsbn(offers: BookOffer[], isbn: string): BookOffer[] {
  return offers.map((offer) => (offer.isbn ? offer : { ...offer, isbn }));
}

export async function searchBooksByIsbn(isbn: string): Promise<BookDetailResponse> {
  const fanout = await runProviderSearch({
    method: 'searchByIsbn',
    value: isbn,
    failureMessage: 'One or more providers failed during ISBN search.',
    emptyMessage: (providerName) => `No ${providerName} search results matched this ISBN.`,
  });

  const offers = annotateOffersWithIsbn(fanout.offers, isbn);
  const clusters = clusterOffersIntoBooks(offers);
  const cluster = clusters.find((entry) => entry.isbn === isbn) ?? clusters[0];
  const book = cluster ? clusterToBookDetail(cluster) : null;

  return createBookDetailResponse({
    query: { isbn },
    book,
    sources: fanout.sources,
    liveScraping: fanout.liveScraping,
    ...(fanout.message ? { message: fanout.message } : {}),
  });
}
