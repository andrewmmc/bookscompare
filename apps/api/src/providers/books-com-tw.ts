import { fetchBooksComTwOffers } from '../sources/books-com-tw';

import type { BookProvider } from './types';

export const booksComTwProvider: BookProvider = {
  id: 'books-com-tw',
  name: '博客來',
  enabled: true,
  usesJsonApi: false,
  timeoutMs: 8000,
  searchByIsbn: fetchBooksComTwOffers,
  searchByTitle: fetchBooksComTwOffers,
};
