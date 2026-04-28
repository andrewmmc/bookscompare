import type { ApiErrorResponse, LookupResponse } from '@bookscompare/contracts';

import { isValidIsbn, normalizeIsbn } from './lib/isbn';
import { createErrorResponse } from './lib/responses';
import { searchBooksByIsbn } from './services/search-by-isbn';

const LOOKUP_CACHE_CONTROL = 'public, max-age=0, s-maxage=1800';
const LOOKUP_CACHE_HEADER = 'x-bookscompare-cache';

function jsonResponse(
  payload: LookupResponse | ApiErrorResponse | Record<string, string | boolean>,
  status = 200,
  cacheControl = 'no-store'
): Response {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: {
      'cache-control': cacheControl,
      'content-type': 'application/json; charset=utf-8',
    },
  });
}

function matchIsbnPath(pathname: string): string | null {
  const match = pathname.match(/^\/(?:book\/)?isbn\/([^/]+)$/);

  return match?.[1] ?? null;
}

function createLookupCacheKey(request: Request, isbn: string): Request {
  return new Request(new URL(`/isbn/${encodeURIComponent(isbn)}`, request.url).toString(), {
    method: 'GET',
  });
}

function getLookupCache(): Cache {
  return (caches as CacheStorage & { default: Cache }).default;
}

function shouldCacheLookupResponse(payload: LookupResponse): boolean {
  return payload.sources.every((source) => source.status !== 'error');
}

function withLookupCacheStatus(response: Response, status: 'HIT' | 'MISS'): Response {
  const headers = new Headers(response.headers);
  headers.set(LOOKUP_CACHE_HEADER, status);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request: Request, _env: unknown, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const { method } = request;
    const { pathname } = url;

    if (method !== 'GET') {
      return jsonResponse(
        createErrorResponse('METHOD_NOT_ALLOWED', 'Only GET requests are supported.'),
        405
      );
    }

    if (pathname === '/') {
      return jsonResponse({
        ok: true,
        service: 'bookscompare-api',
        message:
          'Cloudflare Worker is running. Live scrapers are intentionally disabled during the rebuild.',
      });
    }

    if (pathname === '/health') {
      return jsonResponse({
        ok: true,
        service: 'bookscompare-api',
      });
    }

    const isbnParam = matchIsbnPath(pathname);

    if (isbnParam) {
      const isbn = normalizeIsbn(isbnParam);

      if (!isValidIsbn(isbn)) {
        return withLookupCacheStatus(
          jsonResponse(
            createErrorResponse('INVALID_ISBN', 'Provide a valid ISBN-10 or ISBN-13 value.'),
            400
          ),
          'MISS'
        );
      }

      const cacheKey = createLookupCacheKey(request, isbn);
      const cache = getLookupCache();
      const cachedResponse = await cache.match(cacheKey);

      if (cachedResponse) {
        return withLookupCacheStatus(cachedResponse, 'HIT');
      }

      const lookupResponse = await searchBooksByIsbn(isbn);

      if (!shouldCacheLookupResponse(lookupResponse)) {
        return withLookupCacheStatus(jsonResponse(lookupResponse), 'MISS');
      }

      const response = jsonResponse(lookupResponse, 200, LOOKUP_CACHE_CONTROL);
      ctx.waitUntil(cache.put(cacheKey, response.clone()));

      return withLookupCacheStatus(response, 'MISS');
    }

    return jsonResponse(createErrorResponse('NOT_FOUND', `No route matches ${url.pathname}.`), 404);
  },
} satisfies ExportedHandler;
