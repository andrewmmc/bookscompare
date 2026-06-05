import { BOOK_SOURCES } from '@bookscompare/contracts';

import { logParseFailure } from '../lib/logger';

import type { BookOffer, BookSourceId, Currency } from '@bookscompare/contracts';

export const DEFAULT_CURRENCY: Currency = 'TWD';

export function sourceMeta(sourceId: BookSourceId): { id: BookSourceId; name: string } {
  const source = BOOK_SOURCES.find((item) => item.id === sourceId);

  if (!source) {
    throw new Error(`Unknown source id: ${sourceId}`);
  }

  return source;
}

interface ParseRowsInput<Row> {
  providerId: BookSourceId;
  requestUrl?: string | undefined;
  rows: Row[];
  getBlock: (row: Row) => string | undefined;
  parseOffer: (block: string, row: Row) => BookOffer;
  incompleteRowMessage: string;
}

export function parseSearchResultRows<Row>({
  providerId,
  requestUrl,
  rows,
  getBlock,
  parseOffer,
  incompleteRowMessage,
}: ParseRowsInput<Row>): BookOffer[] {
  const results: BookOffer[] = [];

  for (const row of rows) {
    const block = getBlock(row);

    if (!block) {
      logParseFailure({
        providerId,
        reason: incompleteRowMessage,
        ...(requestUrl ? { url: requestUrl } : {}),
      });
      continue;
    }

    try {
      results.push(parseOffer(block, row));
    } catch (error) {
      logParseFailure({
        providerId,
        reason: error instanceof Error ? error.message : String(error),
        ...(requestUrl ? { url: requestUrl } : {}),
      });
    }
  }

  return results;
}

export function dedupeOffersBySourceProductId(offers: BookOffer[]): BookOffer[] {
  const seen = new Set<string>();

  return offers.filter((offer) => {
    const key = `${offer.sourceId}:${offer.sourceProductId}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}
