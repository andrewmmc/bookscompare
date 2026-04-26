import type { ApiErrorResponse, LookupResponse, SourceState } from '@bookscompare/contracts'

import { isValidIsbn, normalizeIsbn } from './lib/isbn'
import { createDisabledSourceState, createErrorResponse, createLookupResponse } from './lib/responses'
import { fetchBooksComTwOffersByIsbn } from './sources/books-com-tw'

function jsonResponse(payload: LookupResponse | ApiErrorResponse | Record<string, string | boolean>, status = 200): Response {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: {
      'cache-control': 'no-store',
      'content-type': 'application/json; charset=utf-8',
    },
  })
}

function matchIsbnPath(pathname: string): string | null {
  const match = pathname.match(/^\/(?:book\/)?isbn\/([^/]+)$/)

  return match?.[1] ?? null
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const { method } = request
    const { pathname } = url

    if (method !== 'GET') {
      return jsonResponse(createErrorResponse('METHOD_NOT_ALLOWED', 'Only GET requests are supported.'), 405)
    }

    if (pathname === '/') {
      return jsonResponse({
        ok: true,
        service: 'bookscompare-api',
        message: 'Cloudflare Worker is running. Live scrapers are intentionally disabled during the rebuild.',
      })
    }

    if (pathname === '/health') {
      return jsonResponse({
        ok: true,
        service: 'bookscompare-api',
      })
    }

    const isbnParam = matchIsbnPath(pathname)

    if (isbnParam) {
      const isbn = normalizeIsbn(isbnParam)

      if (!isValidIsbn(isbn)) {
        return jsonResponse(createErrorResponse('INVALID_ISBN', 'Provide a valid ISBN-10 or ISBN-13 value.'), 400)
      }

      const sources: SourceState[] = [
        createDisabledSourceState('kingstone'),
        createDisabledSourceState('cite'),
      ]

      try {
        const booksOffers = await fetchBooksComTwOffersByIsbn(isbn)
        const booksState: SourceState = {
          id: 'books-com-tw',
          name: '博客來',
          status: 'ready',
          ...(booksOffers.length === 0 ? { message: 'No 博客來 search results matched this ISBN.' } : {}),
        }

        sources.unshift(booksState)

        return jsonResponse(createLookupResponse({
          isbn,
          data: booksOffers,
          sources,
          liveScraping: true,
          message: '博客來 ISBN search is live. Other sources are still disabled during the migration.',
        }))
      } catch (error) {
        sources.unshift({
          id: 'books-com-tw',
          name: '博客來',
          status: 'error',
          message: error instanceof Error ? error.message : 'Unexpected 博客來 parser error.',
        })

        return jsonResponse(createLookupResponse({
          isbn,
          data: [],
          sources,
          liveScraping: false,
          message: '博客來 ISBN search failed. Other sources remain disabled during the migration.',
        }))
      }
    }

    return jsonResponse(createErrorResponse('NOT_FOUND', `No route matches ${url.pathname}.`), 404)
  },
} satisfies ExportedHandler
