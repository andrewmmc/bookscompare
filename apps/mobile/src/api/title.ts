import { apiGet } from './client';

import type { SearchResponse } from '@bookscompare/contracts';

export function searchByTitle(title: string): Promise<SearchResponse> {
  return apiGet<SearchResponse>(`/search?q=${encodeURIComponent(title)}`);
}
