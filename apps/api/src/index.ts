import { isValidIsbn, normalizeIsbn } from '@bookscompare/contracts';

import { jsonResponse, withoutBody } from './lib/http';
import {
  createBookByTitleCacheKey,
  createIsbnCacheKey,
  createSearchCacheKey,
  handleCachedHead,
  handleCachedLookup,
  withLookupCacheStatus,
} from './lib/lookup-cache';
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

const SEARCH_QUERY_MAX_LENGTH = 100;
const AUTHOR_QUERY_MAX_LENGTH = 100;
const LOOKUP_RATE_LIMIT_PERIOD_SECONDS = 60;

function normalizeFreeTextQuery(input: string | null): string {
  return (input ?? '').trim().replace(/\s+/g, ' ');
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
    { 'retry-after': String(LOOKUP_RATE_LIMIT_PERIOD_SECONDS) }
  );
}

function matchIsbnPath(pathname: string): string | null {
  const match = pathname.match(/^\/(?:book\/)?isbn\/([^/]+)$/);

  return match?.[1] ?? null;
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
  const beforeLookup = () => rateLimitResponse(request, env, 'isbn');
  return headOnly
    ? handleCachedHead(cacheKey, beforeLookup)
    : handleCachedLookup(ctx, cacheKey, () => searchBooksByIsbn(isbn), beforeLookup);
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
  const beforeLookup = () => rateLimitResponse(request, env, 'search');
  return headOnly
    ? handleCachedHead(cacheKey, beforeLookup)
    : handleCachedLookup(ctx, cacheKey, () => searchBooksByTitle(query), beforeLookup);
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
  const beforeLookup = () => rateLimitResponse(request, env, 'book-by-title');
  return headOnly
    ? handleCachedHead(cacheKey, beforeLookup)
    : handleCachedLookup(
        ctx,
        cacheKey,
        () =>
          lookupBookByTitleAuthor({
            title,
            ...(author ? { author } : {}),
          }),
        beforeLookup
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
