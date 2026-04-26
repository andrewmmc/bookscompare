import { fetchCiteOffersByIsbn } from '../sources/cite'

import type { BookProvider } from './types'

export const citeProvider: BookProvider = {
  id: 'cite',
  name: '城邦讀書花園',
  enabled: true,
  usesJsonApi: false,
  timeoutMs: 8000,
  searchByIsbn: fetchCiteOffersByIsbn,
}
