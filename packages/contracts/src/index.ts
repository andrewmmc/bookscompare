export const BOOK_SOURCES = [
  {
    id: 'books-com-tw',
    name: '博客來',
  },
  {
    id: 'kingstone',
    name: '金石堂',
  },
  {
    id: 'cite',
    name: '城邦讀書花園',
  },
  {
    id: 'eslite',
    name: '誠品線上',
  },
] as const

export type BookSourceId = (typeof BOOK_SOURCES)[number]['id']

export interface BookOffer {
  sourceId: BookSourceId
  sourceName: string
  sourceProductId: string
  title: string
  productType: string
  authors: string[]
  publisher: string
  publicationDate: string
  summary: string
  price: number
  currency: 'TWD'
  priceText: string
  discountRate?: number
  url: string
  imageUrl: string
  previewUrl?: string
  badges: string[]
}

export interface SourceState {
  id: BookSourceId
  name: string
  status: 'disabled' | 'ready' | 'error'
  message?: string
}

export interface LookupResponse {
  query: {
    isbn: string
  }
  data: BookOffer[]
  sources: SourceState[]
  meta: {
    liveScraping: boolean
    requestedAt: string
    message?: string
  }
}

export interface ApiErrorResponse {
  error: {
    code: 'INVALID_ISBN' | 'METHOD_NOT_ALLOWED' | 'NOT_FOUND'
    message: string
  }
}
