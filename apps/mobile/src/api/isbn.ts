import { apiGet } from './client';

import type { LookupResponse } from '@bookscompare/contracts';

export function lookupIsbn(isbn: string): Promise<LookupResponse> {
  return apiGet<LookupResponse>(`/isbn/${encodeURIComponent(isbn)}`);
}
