import type { BookOffer, BookSourceId } from '@bookscompare/contracts'

export interface BookProvider {
  id: BookSourceId
  name: string
  enabled: boolean
  searchByIsbn(isbn: string): Promise<BookOffer[]>
}
