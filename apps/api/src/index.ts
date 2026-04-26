import type { ApiErrorResponse, LookupResponse } from '@bookscompare/contracts'

import { isValidIsbn, normalizeIsbn } from './lib/isbn'
import { createErrorResponse } from './lib/responses'
import { searchBooksByIsbn } from './services/search-by-isbn'

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

      return jsonResponse(await searchBooksByIsbn(isbn))
    }

    return jsonResponse(createErrorResponse('NOT_FOUND', `No route matches ${url.pathname}.`), 404)
  },
} satisfies ExportedHandler
