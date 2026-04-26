import { fetchKingstoneOffersByIsbn } from '../sources/kingstone'

import type { BookProvider } from './types'

export const kingstoneProvider: BookProvider = {
  id: 'kingstone',
  name: '金石堂',
  enabled: true,
  searchByIsbn: fetchKingstoneOffersByIsbn,
}
