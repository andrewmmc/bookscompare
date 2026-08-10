import { apiGet } from './client';

import { isBookDetailResponse, type BookDetailResponse } from '@bookscompare/contracts';

export function lookupIsbn(isbn: string, signal?: AbortSignal): Promise<BookDetailResponse> {
  return apiGet<BookDetailResponse>(
    `/isbn/${encodeURIComponent(isbn)}`,
    signal,
    isBookDetailResponse
  );
}
