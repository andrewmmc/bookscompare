import {
  isValidIsbn,
  normalizeIsbn,
  type ApiErrorResponse,
  type BookDetailResponse,
  type SearchResponse,
} from '@bookscompare/contracts';

import { createErrorResponse } from './lib/responses';
import { lookupBookByTitleAuthor } from './services/book-by-title';
import { searchBooksByIsbn } from './services/search-by-isbn';
import { searchBooksByTitle } from './services/search-by-title';

interface RateLimiter {
  limit(input: { key: string }): Promise<{ success: boolean }>;
}

interface Env {
  LOOKUP_RATE_LIMITER?: RateLimiter;
}

const LOOKUP_CACHE_CONTROL = 'public, max-age=0, s-maxage=1800';
const LOOKUP_CACHE_HEADER = 'x-bookscompare-cache';
const SEARCH_QUERY_MAX_LENGTH = 100;
const AUTHOR_QUERY_MAX_LENGTH = 100;

type CachedLookupPayload =
  | SearchResponse
  | BookDetailResponse
  | ApiErrorResponse
  | Record<string, string | boolean>;

function jsonResponse(
  payload: CachedLookupPayload,
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

function createIsbnCacheKey(request: Request, isbn: string): Request {
  return new Request(new URL(`/isbn/${encodeURIComponent(isbn)}`, request.url).toString(), {
    method: 'GET',
  });
}

function createSearchCacheKey(request: Request, query: string): Request {
  const url = new URL('/search', request.url);
  url.searchParams.set('q', query);

  return new Request(url.toString(), { method: 'GET' });
}

function createBookByTitleCacheKey(request: Request, title: string, author?: string): Request {
  const url = new URL('/book/by-title', request.url);
  url.searchParams.set('title', title);
  if (author) {
    url.searchParams.set('author', author);
  }

  return new Request(url.toString(), { method: 'GET' });
}

function getLookupCache(): Cache {
  return (caches as CacheStorage & { default: Cache }).default;
}

function normalizeFreeTextQuery(input: string | null): string {
  return (input ?? '').trim().replace(/\s+/g, ' ');
}

function shouldCacheLookupResponse(payload: SearchResponse | BookDetailResponse): boolean {
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

function invalidRequestResponse(
  code: Parameters<typeof createErrorResponse>[0],
  message: string
): Response {
  return withLookupCacheStatus(jsonResponse(createErrorResponse(code, message), 400), 'MISS');
}

async function rateLimitResponse(
  request: Request,
  env: Env,
  route: 'isbn' | 'search' | 'book-by-title'
): Promise<Response | null> {
  if (!env.LOOKUP_RATE_LIMITER) {
    return null;
  }

  const clientAddress = request.headers.get('cf-connecting-ip') ?? 'unknown-client';
  const { success } = await env.LOOKUP_RATE_LIMITER.limit({ key: `${route}:${clientAddress}` });

  if (success) {
    return null;
  }

  return jsonResponse(
    createErrorResponse('RATE_LIMITED', 'Too many lookup requests. Try again shortly.'),
    429,
    'no-store',
    { 'retry-after': '60' }
  );
}

async function handleCachedLookup(
  ctx: ExecutionContext,
  cacheKey: Request,
  runLookup: () => Promise<SearchResponse | BookDetailResponse>
): Promise<Response> {
  const cache = getLookupCache();
  const cachedResponse = await cache.match(cacheKey);

  if (cachedResponse) {
    return withLookupCacheStatus(cachedResponse, 'HIT');
  }

  const lookupResponse = await runLookup();

  if (!shouldCacheLookupResponse(lookupResponse)) {
    return withLookupCacheStatus(jsonResponse(lookupResponse), 'MISS');
  }

  const response = jsonResponse(lookupResponse, 200, LOOKUP_CACHE_CONTROL);
  ctx.waitUntil(cache.put(cacheKey, response.clone()));

  return withLookupCacheStatus(response, 'MISS');
}

async function handleIsbnRoute(
  request: Request,
  ctx: ExecutionContext,
  rawIsbn: string
): Promise<Response> {
  const isbn = normalizeIsbn(rawIsbn);

  if (!isValidIsbn(isbn)) {
    return invalidRequestResponse('INVALID_ISBN', 'Provide a valid ISBN-10 or ISBN-13 value.');
  }

  return handleCachedLookup(ctx, createIsbnCacheKey(request, isbn), () => searchBooksByIsbn(isbn));
}

async function handleSearchRoute(
  request: Request,
  ctx: ExecutionContext,
  url: URL
): Promise<Response> {
  const query = normalizeFreeTextQuery(url.searchParams.get('q'));

  if (!query) {
    return invalidRequestResponse('INVALID_QUERY', 'Provide a non-empty search query via ?q=.');
  }

  if (query.length > SEARCH_QUERY_MAX_LENGTH) {
    return invalidRequestResponse(
      'INVALID_QUERY',
      `Search query must be ${SEARCH_QUERY_MAX_LENGTH} characters or fewer.`
    );
  }

  return handleCachedLookup(ctx, createSearchCacheKey(request, query), () =>
    searchBooksByTitle(query)
  );
}

async function handleBookByTitleRoute(
  request: Request,
  ctx: ExecutionContext,
  url: URL
): Promise<Response> {
  const title = normalizeFreeTextQuery(url.searchParams.get('title'));
  const author = normalizeFreeTextQuery(url.searchParams.get('author'));

  if (!title) {
    return invalidRequestResponse('INVALID_QUERY', 'Provide a non-empty title via ?title=.');
  }

  if (title.length > SEARCH_QUERY_MAX_LENGTH) {
    return invalidRequestResponse(
      'INVALID_QUERY',
      `Title must be ${SEARCH_QUERY_MAX_LENGTH} characters or fewer.`
    );
  }

  if (author && author.length > AUTHOR_QUERY_MAX_LENGTH) {
    return invalidRequestResponse(
      'INVALID_QUERY',
      `Author must be ${AUTHOR_QUERY_MAX_LENGTH} characters or fewer.`
    );
  }

  return handleCachedLookup(
    ctx,
    createBookByTitleCacheKey(request, title, author || undefined),
    () =>
      lookupBookByTitleAuthor({
        title,
        ...(author ? { author } : {}),
      })
  );
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
          'Cloudflare Worker is running. Use /isbn/:id for ISBN lookups, /search?q= for title search, and /book/by-title?title=&author= for non-ISBN book detail.',
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
      const limited = await rateLimitResponse(request, env, 'isbn');
      if (limited) return limited;
      return handleIsbnRoute(request, ctx, isbnParam);
    }

    if (pathname === '/search') {
      const limited = await rateLimitResponse(request, env, 'search');
      if (limited) return limited;
      return handleSearchRoute(request, ctx, url);
    }

    if (pathname === '/book/by-title') {
      const limited = await rateLimitResponse(request, env, 'book-by-title');
      if (limited) return limited;
      return handleBookByTitleRoute(request, ctx, url);
    }

    return jsonResponse(createErrorResponse('NOT_FOUND', `No route matches ${url.pathname}.`), 404);
  },
} satisfies ExportedHandler<Env>;
