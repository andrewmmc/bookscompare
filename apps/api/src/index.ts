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
  SearchResponse | BookDetailResponse | ApiErrorResponse | Record<string, string | boolean>;

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

function withoutBody(response: Response): Response {
  return new Response(null, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
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

async function handleCachedHead(cacheKey: Request): Promise<Response> {
  const cachedResponse = await getLookupCache().match(cacheKey);
  if (cachedResponse) {
    return withoutBody(withLookupCacheStatus(cachedResponse, 'HIT'));
  }

  return withLookupCacheStatus(
    new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } }),
    'MISS'
  );
}

async function handleIsbnRoute(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  rawIsbn: string,
  headOnly = false
): Promise<Response> {
  const isbn = normalizeIsbn(rawIsbn);

  if (!isValidIsbn(isbn)) {
    return invalidRequestResponse('INVALID_ISBN', 'Provide a valid ISBN-10 or ISBN-13 value.');
  }

  const cacheKey = createIsbnCacheKey(request, isbn);
  return headOnly
    ? handleCachedHead(cacheKey)
    : handleCachedLookup(
        ctx,
        cacheKey,
        () => searchBooksByIsbn(isbn),
        () => rateLimitResponse(request, env, 'isbn')
      );
}

async function handleSearchRoute(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  url: URL,
  headOnly = false
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

  const cacheKey = createSearchCacheKey(request, query);
  return headOnly
    ? handleCachedHead(cacheKey)
    : handleCachedLookup(
        ctx,
        cacheKey,
        () => searchBooksByTitle(query),
        () => rateLimitResponse(request, env, 'search')
      );
}

async function handleBookByTitleRoute(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  url: URL,
  headOnly = false
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

  const cacheKey = createBookByTitleCacheKey(request, title, author || undefined);
  return headOnly
    ? handleCachedHead(cacheKey)
    : handleCachedLookup(
        ctx,
        cacheKey,
        () =>
          lookupBookByTitleAuthor({
            title,
            ...(author ? { author } : {}),
          }),
        () => rateLimitResponse(request, env, 'book-by-title')
      );
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const { method } = request;
    const { pathname } = url;
    const respond = (response: Response) => (method === 'HEAD' ? withoutBody(response) : response);

    if (method !== 'GET' && method !== 'HEAD') {
      return jsonResponse(
        createErrorResponse('METHOD_NOT_ALLOWED', 'Only GET and HEAD requests are supported.'),
        405,
        'no-store',
        { allow: 'GET, HEAD' }
      );
    }

    if (pathname === '/') {
      return respond(
        jsonResponse({
          ok: true,
          service: 'bookscompare-api',
          message:
            'Cloudflare Worker is running. Use /isbn/:id for ISBN lookups, /search?q= for title search, and /book/by-title?title=&author= for non-ISBN book detail.',
        })
      );
    }

    if (pathname === '/health') {
      return respond(
        jsonResponse({
          ok: true,
          service: 'bookscompare-api',
        })
      );
    }

    const isbnParam = matchIsbnPath(pathname);

    if (isbnParam) {
      return respond(await handleIsbnRoute(request, env, ctx, isbnParam, method === 'HEAD'));
    }

    if (pathname === '/search') {
      return respond(await handleSearchRoute(request, env, ctx, url, method === 'HEAD'));
    }

    if (pathname === '/book/by-title') {
      return respond(await handleBookByTitleRoute(request, env, ctx, url, method === 'HEAD'));
    }

    return respond(
      jsonResponse(createErrorResponse('NOT_FOUND', `No route matches ${url.pathname}.`), 404)
    );
  },
} satisfies ExportedHandler<Env>;
