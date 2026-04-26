import type { BookOffer, BookSourceId } from '@bookscompare/contracts';

export interface ProviderSearchOptions {
  timeoutMs?: number;
}

export interface BookProvider {
  id: BookSourceId;
  name: string;
  enabled: boolean;
  usesJsonApi: boolean;
  timeoutMs: number;
  searchByIsbn(isbn: string, options?: ProviderSearchOptions): Promise<BookOffer[]>;
}
