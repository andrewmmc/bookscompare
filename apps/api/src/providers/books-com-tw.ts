import { fetchBooksComTwOffersByIsbn } from '../sources/books-com-tw'

import type { BookProvider } from './types'

export const booksComTwProvider: BookProvider = {
  id: 'books-com-tw',
  name: '博客來',
  enabled: true,
  searchByIsbn: fetchBooksComTwOffersByIsbn,
}
