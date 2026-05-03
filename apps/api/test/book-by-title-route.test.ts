import assert from 'node:assert/strict';
import test from 'node:test';

import type { BookDetailResponse, BookOffer } from '@bookscompare/contracts';

import worker from '../src/index';
import { providers } from '../src/providers/registry';

import type { BookProvider } from '../src/providers/types';

function getBookProviders(): BookProvider[] {
  return providers.filter((provider): provider is BookProvider => 'searchByTitle' in provider);
}

function createOffer(provider: BookProvider, title: string, price: number): BookOffer {
  return {
    sourceId: provider.id,
    sourceName: provider.name,
    sourceProductId: `${provider.id}-offer`,
    title,
    productType: '中文書',
    authors: ['James Clear'],
    publisher: '方智',
    publicationDate: '2025-01-01',
    summary: `${provider.name} summary`,
    price,
    currency: 'TWD',
    priceText: `${price} 元`,
    url: `https://example.com/${provider.id}`,
    imageUrl: `https://example.com/${provider.id}.jpg`,
    badges: [],
  };
}

function createExecutionContext() {
  const pending: Promise<unknown>[] = [];

  return {
    pending,
    waitUntil(promise: Promise<unknown>) {
      pending.push(promise);
    },
    passThroughOnException() {},
  } as ExecutionContext & { pending: Promise<unknown>[] };
}

function createFakeCache() {
  const store = new Map<string, Response>();

  return {
    store,
    cache: {
      async match(request: Request | string): Promise<Response | undefined> {
        const key = typeof request === 'string' ? request : request.url;
        const response = store.get(key);

        return response?.clone();
      },
      async put(request: Request | string, response: Response): Promise<void> {
        const key = typeof request === 'string' ? request : request.url;
        store.set(key, response.clone());
      },
    },
  };
}

function createTestEnv(rateLimitSuccess = true) {
  const keys: string[] = [];

  return {
    env: {
      ISBN_LIMITER: {
        async limit({ key }: { key: string }): Promise<{ success: boolean }> {
          keys.push(key);

          return { success: rateLimitSuccess };
        },
      },
    },
    keys,
  };
}

function installFakeCaches(t: { after: (fn: () => void) => void }) {
  const { cache, store } = createFakeCache();
  const originalCaches = globalThis.caches;

  Object.defineProperty(globalThis, 'caches', {
    value: { default: cache },
    configurable: true,
    writable: true,
  });

  t.after(() => {
    if (originalCaches) {
      Object.defineProperty(globalThis, 'caches', {
        value: originalCaches,
        configurable: true,
        writable: true,
      });
      return;
    }

    Reflect.deleteProperty(globalThis, 'caches');
  });

  return { store };
}

function stubSearchByTitle(
  t: { after: (fn: () => void) => void },
  factory: (provider: BookProvider) => BookProvider['searchByTitle']
) {
  const bookProviders = getBookProviders();
  const original = bookProviders.map((provider) => ({
    provider,
    searchByTitle: provider.searchByTitle,
  }));

  t.after(() => {
    for (const entry of original) {
      entry.provider.searchByTitle = entry.searchByTitle;
    }
  });

  for (const provider of bookProviders) {
    provider.searchByTitle = factory(provider);
  }
}

test('worker /book/by-title returns the matching cluster as a BookDetail', async (t) => {
  installFakeCaches(t);
  const { env } = createTestEnv();

  stubSearchByTitle(t, (provider) => async (title: string) => {
    if (provider.id === 'cite') {
      return [];
    }
    return [createOffer(provider, title, provider.id === 'kingstone' ? 250 : 320)];
  });

  const response = await worker.fetch(
    new Request(
      'https://bookscompare-api.andrewmmc.workers.dev/book/by-title?title=%E5%8E%9F%E5%AD%90%E7%BF%92%E6%85%A3&author=James%20Clear'
    ),
    env,
    createExecutionContext()
  );
  const body = (await response.json()) as BookDetailResponse;

  assert.equal(response.status, 200);
  assert.deepEqual(body.query, { title: '原子習慣', author: 'James Clear' });
  assert.ok(body.book);
  assert.equal(body.book?.title, '原子習慣');
  assert.equal(body.book?.offers.length, 3);
  assert.deepEqual(
    body.book?.offers.map((offer) => offer.price),
    [250, 320, 320]
  );
});

test('worker /book/by-title caches successful lookups under a canonical key', async (t) => {
  const { store } = installFakeCaches(t);
  const { env } = createTestEnv();
  const callCounts = new Map<BookProvider['id'], number>();

  stubSearchByTitle(t, (provider) => async (title: string) => {
    callCounts.set(provider.id, (callCounts.get(provider.id) ?? 0) + 1);
    return provider.id === 'books-com-tw' ? [createOffer(provider, title, 320)] : [];
  });

  const firstContext = createExecutionContext();
  const firstResponse = await worker.fetch(
    new Request(
      'https://bookscompare-api.andrewmmc.workers.dev/book/by-title?title=%E5%8E%9F%E5%AD%90%E7%BF%92%E6%85%A3'
    ),
    env,
    firstContext
  );

  await Promise.all(firstContext.pending);

  assert.equal(firstResponse.status, 200);
  assert.equal(firstResponse.headers.get('cache-control'), 'public, max-age=0, s-maxage=1800');
  assert.equal(firstResponse.headers.get('x-bookscompare-cache'), 'MISS');
  assert.equal(store.size, 1);
  assert.deepEqual(Object.fromEntries(callCounts), {
    'books-com-tw': 1,
    kingstone: 1,
    cite: 1,
    eslite: 1,
  });

  const secondContext = createExecutionContext();
  const secondResponse = await worker.fetch(
    new Request(
      'https://bookscompare-api.andrewmmc.workers.dev/book/by-title?title=%E5%8E%9F%E5%AD%90%E7%BF%92%E6%85%A3'
    ),
    env,
    secondContext
  );

  assert.equal(secondResponse.status, 200);
  assert.equal(secondResponse.headers.get('x-bookscompare-cache'), 'HIT');
  // Providers should not be called again on a cache hit.
  assert.deepEqual(Object.fromEntries(callCounts), {
    'books-com-tw': 1,
    kingstone: 1,
    cite: 1,
    eslite: 1,
  });
});

test('worker /book/by-title returns book: null when no cluster matches', async (t) => {
  installFakeCaches(t);
  const { env } = createTestEnv();

  stubSearchByTitle(t, (provider) => async (title: string) => {
    return [createOffer(provider, title, 320)];
  });

  const response = await worker.fetch(
    new Request(
      'https://bookscompare-api.andrewmmc.workers.dev/book/by-title?title=Some%20Other%20Book&author=Other%20Author'
    ),
    env,
    createExecutionContext()
  );
  const body = (await response.json()) as BookDetailResponse;

  assert.equal(response.status, 200);
  // None of the stubbed offers used "Some Other Book" as the title, so the
  // by-title lookup cannot find a matching cluster.
  assert.equal(body.book, null);
});

test('worker /book/by-title returns 400 when the title parameter is missing', async (t) => {
  installFakeCaches(t);
  const { env } = createTestEnv();

  const response = await worker.fetch(
    new Request('https://bookscompare-api.andrewmmc.workers.dev/book/by-title'),
    env,
    createExecutionContext()
  );
  const body = (await response.json()) as { error: { code: string } };

  assert.equal(response.status, 400);
  assert.equal(body.error.code, 'INVALID_QUERY');
});

test('worker /book/by-title returns 429 before provider fanout when the rate limit is exceeded', async (t) => {
  const { store } = installFakeCaches(t);
  const { env, keys } = createTestEnv(false);
  let providerCalls = 0;

  stubSearchByTitle(t, (provider) => async (title: string) => {
    providerCalls += 1;
    return [createOffer(provider, title, 320)];
  });

  const response = await worker.fetch(
    new Request(
      'https://bookscompare-api.andrewmmc.workers.dev/book/by-title?title=%E5%8E%9F%E5%AD%90%E7%BF%92%E6%85%A3',
      {
        headers: { 'cf-connecting-ip': '203.0.113.30' },
      }
    ),
    env,
    createExecutionContext()
  );
  const body = (await response.json()) as { error: { code: string } };

  assert.equal(response.status, 429);
  assert.equal(response.headers.get('retry-after'), '10');
  assert.equal(providerCalls, 0);
  assert.equal(store.size, 0);
  assert.deepEqual(keys, ['search:203.0.113.30']);
  assert.equal(body.error.code, 'RATE_LIMITED');
});
