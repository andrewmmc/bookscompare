import { BOOK_SOURCES, type ApiErrorResponse, type LookupResponse } from '@bookscompare/contracts'

const placeholderMessage = 'Live scraping is temporarily disabled while the API is being rebuilt for Cloudflare Workers.'

export function createLookupResponse(isbn: string): LookupResponse {
  return {
    query: { isbn },
    data: [],
    sources: BOOK_SOURCES.map((source) => ({
      id: source.id,
      name: source.name,
      status: 'disabled',
      message: placeholderMessage,
    })),
    meta: {
      liveScraping: false,
      requestedAt: new Date().toISOString(),
      message: placeholderMessage,
    },
  }
}

export function createErrorResponse(code: ApiErrorResponse['error']['code'], message: string): ApiErrorResponse {
  return {
    error: {
      code,
      message,
    },
  }
}
