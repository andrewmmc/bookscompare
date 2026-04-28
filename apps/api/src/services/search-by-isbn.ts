import { runProviderSearch } from './provider-fanout';

import type { LookupResponse } from '@bookscompare/contracts';

export function searchBooksByIsbn(isbn: string): Promise<LookupResponse> {
  return runProviderSearch({
    query: { isbn },
    method: 'searchByIsbn',
    value: isbn,
    failureMessage: 'One or more providers failed during ISBN search.',
    emptyMessage: (providerName) => `No ${providerName} search results matched this ISBN.`,
  });
}
