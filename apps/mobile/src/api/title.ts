import { apiGet } from './client';

import type { LookupResponse } from '@bookscompare/contracts';

export function searchByTitle(title: string): Promise<LookupResponse> {
  return apiGet<LookupResponse>(`/search?q=${encodeURIComponent(title)}`);
}
