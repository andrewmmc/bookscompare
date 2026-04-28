import type { ApiErrorResponse, LookupResponse } from '@bookscompare/contracts';

import { isValidIsbn, normalizeIsbn } from './lib/isbn';
import { createErrorResponse } from './lib/responses';
import { searchBooksByIsbn } from './services/search-by-isbn';
import { searchBooksByTitle } from './services/search-by-title';

interface Env {
  ISBN_LIMITER: {
    limit(input: { key: string }): Promise<{ success: boolean }>;
  };
}

const LOOKUP_CACHE_CONTROL = 'public, max-age=0, s-maxage=1800';
const LOOKUP_CACHE_HEADER = 'x-bookscompare-cache';
const LOOKUP_RETRY_AFTER_SECONDS = 10;
const SEARCH_QUERY_MAX_LENGTH = 100;

function jsonResponse(
  payload: LookupResponse | ApiErrorResponse | Record<string, string | boolean>,
  status = 200,
  cacheControl = 'no-store',
  extraHeaders?: HeadersInit
): Response {
  const headers = new Headers(extraHeaders);
  headers.set('cache-control', cacheControl);
  headers.set('content-type', 'application/json; charset=utf-8');

  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers,
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

function createSearchCacheKey(request: Request, query: string): Request {
  const url = new URL('/search', request.url);
  url.searchParams.set('q', query);

  return new Request(url.toString(), { method: 'GET' });
}

function getLookupCache(): Cache {
  return (caches as CacheStorage & { default: Cache }).default;
}

function getLookupRateLimitKey(request: Request): string {
  return `isbn:${request.headers.get('cf-connecting-ip') ?? 'anonymous'}`;
}

function getSearchRateLimitKey(request: Request): string {
  return `search:${request.headers.get('cf-connecting-ip') ?? 'anonymous'}`;
}

function normalizeSearchQuery(input: string | null): string {
  return (input ?? '').trim().replace(/\s+/g, ' ');
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
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
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
          'Cloudflare Worker is running. Use /isbn/:id to look up live offers, or /search?q= for title search.',
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

      const { success } = await env.ISBN_LIMITER.limit({
        key: getLookupRateLimitKey(request),
      });

      if (!success) {
        return withLookupCacheStatus(
          jsonResponse(
            createErrorResponse('RATE_LIMITED', 'Too many ISBN lookups. Try again shortly.'),
            429,
            'no-store',
            {
              'retry-after': String(LOOKUP_RETRY_AFTER_SECONDS),
            }
          ),
          'MISS'
        );
      }

      const lookupResponse = await searchBooksByIsbn(isbn);

      if (!shouldCacheLookupResponse(lookupResponse)) {
        return withLookupCacheStatus(jsonResponse(lookupResponse), 'MISS');
      }

      const response = jsonResponse(lookupResponse, 200, LOOKUP_CACHE_CONTROL);
      ctx.waitUntil(cache.put(cacheKey, response.clone()));

      return withLookupCacheStatus(response, 'MISS');
    }

    if (pathname === '/search') {
      const query = normalizeSearchQuery(url.searchParams.get('q'));

      if (!query) {
        return withLookupCacheStatus(
          jsonResponse(
            createErrorResponse('INVALID_QUERY', 'Provide a non-empty search query via ?q=.'),
            400
          ),
          'MISS'
        );
      }

      if (query.length > SEARCH_QUERY_MAX_LENGTH) {
        return withLookupCacheStatus(
          jsonResponse(
            createErrorResponse(
              'INVALID_QUERY',
              `Search query must be ${SEARCH_QUERY_MAX_LENGTH} characters or fewer.`
            ),
            400
          ),
          'MISS'
        );
      }

      const cacheKey = createSearchCacheKey(request, query);
      const cache = getLookupCache();
      const cachedResponse = await cache.match(cacheKey);

      if (cachedResponse) {
        return withLookupCacheStatus(cachedResponse, 'HIT');
      }

      const { success } = await env.ISBN_LIMITER.limit({
        key: getSearchRateLimitKey(request),
      });

      if (!success) {
        return withLookupCacheStatus(
          jsonResponse(
            createErrorResponse('RATE_LIMITED', 'Too many searches. Try again shortly.'),
            429,
            'no-store',
            {
              'retry-after': String(LOOKUP_RETRY_AFTER_SECONDS),
            }
          ),
          'MISS'
        );
      }

      const lookupResponse = await searchBooksByTitle(query);

      if (!shouldCacheLookupResponse(lookupResponse)) {
        return withLookupCacheStatus(jsonResponse(lookupResponse), 'MISS');
      }

      const response = jsonResponse(lookupResponse, 200, LOOKUP_CACHE_CONTROL);
      ctx.waitUntil(cache.put(cacheKey, response.clone()));

      return withLookupCacheStatus(response, 'MISS');
    }

    return jsonResponse(createErrorResponse('NOT_FOUND', `No route matches ${url.pathname}.`), 404);
  },
} satisfies ExportedHandler<Env>;
