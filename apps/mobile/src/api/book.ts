import { apiGet } from './client';

import type { BookDetailResponse } from '@bookscompare/contracts';

interface LookupBookByTitleInput {
  title: string;
  author?: string;
}

export function lookupBookByTitle({
  title,
  author,
}: LookupBookByTitleInput): Promise<BookDetailResponse> {
  const params = new URLSearchParams({ title });
  if (author) {
    params.set('author', author);
  }

  return apiGet<BookDetailResponse>(`/book/by-title?${params.toString()}`);
}
