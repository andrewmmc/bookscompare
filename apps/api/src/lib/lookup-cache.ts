import type { BookDetailResponse, SearchResponse } from '@bookscompare/contracts';

import { jsonResponse, withoutBody } from './http';

export const LOOKUP_CACHE_CONTROL = 'public, max-age=0, s-maxage=1800';
export const LOOKUP_CACHE_HEADER = 'x-bookscompare-cache';

export function createIsbnCacheKey(request: Request, isbn: string): Request {
  return new Request(new URL(`/isbn/${encodeURIComponent(isbn)}`, request.url).toString(), {
    method: 'GET',
  });
}

export function createSearchCacheKey(request: Request, query: string): Request {
  const url = new URL('/search', request.url);
  url.searchParams.set('q', query);

  return new Request(url.toString(), { method: 'GET' });
}

export function createBookByTitleCacheKey(
  request: Request,
  title: string,
  author?: string
): Request {
  const url = new URL('/book/by-title', request.url);
  url.searchParams.set('title', title);
  if (author) {
    url.searchParams.set('author', author);
  }

  return new Request(url.toString(), { method: 'GET' });
}

export function getLookupCache(): Cache {
  // Cloudflare Workers expose a default Cache via `caches.default`.
  return (caches as CacheStorage & { default: Cache }).default;
}

export function shouldCacheLookupResponse(payload: SearchResponse | BookDetailResponse): boolean {
  return payload.sources.every((source) => source.status !== 'error');
}

export function withLookupCacheStatus(response: Response, status: 'HIT' | 'MISS'): Response {
  const headers = new Headers(response.headers);
  headers.set(LOOKUP_CACHE_HEADER, status);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export async function handleCachedLookup(
  ctx: ExecutionContext,
  cacheKey: Request,
  runLookup: () => Promise<SearchResponse | BookDetailResponse>,
  beforeLookup?: () => Promise<Response | null>
): Promise<Response> {
  const cache = getLookupCache();
  const cachedResponse = await cache.match(cacheKey);

  if (cachedResponse) {
    return withLookupCacheStatus(cachedResponse, 'HIT');
  }

  const blockedResponse = await beforeLookup?.();
  if (blockedResponse) {
    return blockedResponse;
  }

  const lookupResponse = await runLookup();

  if (!shouldCacheLookupResponse(lookupResponse)) {
    return withLookupCacheStatus(jsonResponse(lookupResponse), 'MISS');
  }

  const response = jsonResponse(lookupResponse, 200, LOOKUP_CACHE_CONTROL);
  ctx.waitUntil(cache.put(cacheKey, response.clone()));

  return withLookupCacheStatus(response, 'MISS');
}

export async function handleCachedHead(
  cacheKey: Request,
  beforeLookup?: () => Promise<Response | null>
): Promise<Response> {
  const cachedResponse = await getLookupCache().match(cacheKey);
  if (cachedResponse) {
    return withoutBody(withLookupCacheStatus(cachedResponse, 'HIT'));
  }

  const blockedResponse = await beforeLookup?.();
  if (blockedResponse) {
    return blockedResponse;
  }

  // HEAD never warms the cache: it only probes whether a GET already populated it.
  return withLookupCacheStatus(
    new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } }),
    'MISS'
  );
}
