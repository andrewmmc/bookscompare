import { fetchBooksComTwOffers } from '../sources/books-com-tw';

import { DEFAULT_PROVIDER_TIMEOUT_MS, type BookProvider } from './types';

export const booksComTwProvider: BookProvider = {
  id: 'books-com-tw',
  name: '博客來',
  enabled: true,
  timeoutMs: DEFAULT_PROVIDER_TIMEOUT_MS,
  searchByIsbn: fetchBooksComTwOffers,
  searchByTitle: fetchBooksComTwOffers,
};
