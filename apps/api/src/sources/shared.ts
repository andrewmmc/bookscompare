import { logParseFailure } from '../lib/logger';
import { sourceMeta } from '../lib/source-meta';

import type { BookOffer, BookSourceId, Currency } from '@bookscompare/contracts';

export { sourceMeta };

export const DEFAULT_CURRENCY: Currency = 'TWD';

interface ParseRowsInput<Row> {
  providerId: BookSourceId;
  requestUrl?: string | undefined;
  rows: Row[];
  getBlock: (row: Row) => string | undefined;
  shouldSkip?: (block: string, row: Row) => boolean;
  parseOffer: (block: string, row: Row) => BookOffer;
  incompleteRowMessage: string;
}

export function parseSearchResultRows<Row>({
  providerId,
  requestUrl,
  rows,
  getBlock,
  shouldSkip,
  parseOffer,
  incompleteRowMessage,
}: ParseRowsInput<Row>): BookOffer[] {
  const results: BookOffer[] = [];
  let failedRows = 0;

  for (const row of rows) {
    const block = getBlock(row);

    if (!block) {
      logParseFailure({
        providerId,
        reason: incompleteRowMessage,
        ...(requestUrl ? { url: requestUrl } : {}),
      });
      failedRows += 1;
      continue;
    }

    if (shouldSkip?.(block, row)) {
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
      failedRows += 1;
    }
  }

  if (failedRows > 0 && results.length > 0) {
    throw new Error(`${providerId} parser rejected ${failedRows} search result row(s).`);
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
