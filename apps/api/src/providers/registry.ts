import { BOOK_SOURCES } from '@bookscompare/contracts'

import { booksComTwProvider } from './books-com-tw'

import type { BookProvider } from './types'

const providerById = new Map<BookProvider['id'], BookProvider>([
  [booksComTwProvider.id, booksComTwProvider],
])

export const providers = BOOK_SOURCES.map((source) => {
  const provider = providerById.get(source.id)

  return provider ?? {
    id: source.id,
    name: source.name,
    enabled: false,
  }
}) satisfies Array<Pick<BookProvider, 'id' | 'name' | 'enabled'> | BookProvider>
