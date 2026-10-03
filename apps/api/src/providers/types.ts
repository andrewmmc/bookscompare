import type { BookOffer, BookSourceId } from '@bookscompare/contracts';

export interface ProviderSearchOptions {
  timeoutMs?: number;
}

export const DEFAULT_PROVIDER_TIMEOUT_MS = 8000;
/** Kingstone HTML search is slower than the other bookstore adapters. */
export const KINGSTONE_PROVIDER_TIMEOUT_MS = 10_000;

export interface BookProvider {
  id: BookSourceId;
  name: string;
  enabled: boolean;
  timeoutMs: number;
  searchByIsbn(isbn: string, options?: ProviderSearchOptions): Promise<BookOffer[]>;
  searchByTitle(title: string, options?: ProviderSearchOptions): Promise<BookOffer[]>;
}
