import { runProviderSearch } from './provider-fanout';

import type { LookupResponse } from '@bookscompare/contracts';

export function searchBooksByTitle(title: string): Promise<LookupResponse> {
  return runProviderSearch({
    query: { title },
    method: 'searchByTitle',
    value: title,
    failureMessage: 'One or more providers failed during title search.',
    emptyMessage: (providerName) => `No ${providerName} search results matched this title.`,
  });
}
