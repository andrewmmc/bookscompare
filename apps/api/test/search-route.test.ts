import assert from 'node:assert/strict';
import test from 'node:test';

import type { BookOffer } from '@bookscompare/contracts';

import worker from '../src/index';
import { providers } from '../src/providers/registry';

import type { BookProvider } from '../src/providers/types';

function getBookProviders(): BookProvider[] {
  return providers.filter((provider): provider is BookProvider => 'searchByTitle' in provider);
}

function createOffer(provider: BookProvider, title: string): BookOffer {
  return {
    sourceId: provider.id,
    sourceName: provider.name,
    sourceProductId: `${provider.id}-offer`,
    title,
    productType: '中文書',
    authors: ['Test Author'],
    publisher: 'Test Publisher',
    publicationDate: '2025-01-01',
    summary: `${provider.name} summary`,
    price: 100,
    currency: 'TWD',
    priceText: '100 元',
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

test('worker /search caches successful title lookups under a canonical key', async (t) => {
  const { store } = installFakeCaches(t);
  const { env, keys } = createTestEnv();
  const callCounts = new Map<BookProvider['id'], number>();

  stubSearchByTitle(t, (provider) => async (title: string) => {
    callCounts.set(provider.id, (callCounts.get(provider.id) ?? 0) + 1);
    return provider.id === 'books-com-tw' ? [createOffer(provider, title)] : [];
  });

  const firstContext = createExecutionContext();
  const firstResponse = await worker.fetch(
    new Request(
      'https://bookscompare-api.andrewmmc.workers.dev/search?q=%E5%93%88%E5%88%A9%E6%B3%A2%E7%89%B9'
    ),
    env,
    firstContext
  );
  const firstBody = (await firstResponse.json()) as {
    query: { title?: string };
    meta: { requestedAt: string };
  };

  await Promise.all(firstContext.pending);

  assert.equal(firstResponse.status, 200);
  assert.equal(firstResponse.headers.get('cache-control'), 'public, max-age=0, s-maxage=1800');
  assert.equal(firstResponse.headers.get('x-bookscompare-cache'), 'MISS');
  assert.equal(firstBody.query.title, '哈利波特');
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
      'https://bookscompare-api.andrewmmc.workers.dev/search?q=%20%E5%93%88%E5%88%A9%E6%B3%A2%E7%89%B9%20'
    ),
    env,
    secondContext
  );
  const secondBody = (await secondResponse.json()) as { meta: { requestedAt: string } };

  assert.equal(secondResponse.status, 200);
  assert.equal(secondResponse.headers.get('x-bookscompare-cache'), 'HIT');
  assert.equal(secondBody.meta.requestedAt, firstBody.meta.requestedAt);
  assert.deepEqual(Object.fromEntries(callCounts), {
    'books-com-tw': 1,
    kingstone: 1,
    cite: 1,
    eslite: 1,
  });
  assert.deepEqual(keys, ['search:anonymous']);
});

test('worker /search returns 400 when query is missing or empty', async (t) => {
  installFakeCaches(t);
  const { env } = createTestEnv();

  const missing = await worker.fetch(
    new Request('https://bookscompare-api.andrewmmc.workers.dev/search'),
    env,
    createExecutionContext()
  );
  const missingBody = (await missing.json()) as { error: { code: string } };

  assert.equal(missing.status, 400);
  assert.equal(missingBody.error.code, 'INVALID_QUERY');

  const blank = await worker.fetch(
    new Request('https://bookscompare-api.andrewmmc.workers.dev/search?q=%20%20%20'),
    env,
    createExecutionContext()
  );
  const blankBody = (await blank.json()) as { error: { code: string } };

  assert.equal(blank.status, 400);
  assert.equal(blankBody.error.code, 'INVALID_QUERY');
});

test('worker /search returns 429 before provider fanout when the rate limit is exceeded', async (t) => {
  const { store } = installFakeCaches(t);
  const { env, keys } = createTestEnv(false);
  let providerCalls = 0;

  stubSearchByTitle(t, (provider) => async (title: string) => {
    providerCalls += 1;
    return [createOffer(provider, title)];
  });

  const context = createExecutionContext();
  const response = await worker.fetch(
    new Request('https://bookscompare-api.andrewmmc.workers.dev/search?q=harry', {
      headers: { 'cf-connecting-ip': '203.0.113.20' },
    }),
    env,
    context
  );
  const body = (await response.json()) as { error: { code: string; message: string } };

  assert.equal(response.status, 429);
  assert.equal(response.headers.get('retry-after'), '10');
  assert.equal(providerCalls, 0);
  assert.equal(store.size, 0);
  assert.deepEqual(keys, ['search:203.0.113.20']);
  assert.equal(body.error.code, 'RATE_LIMITED');
});
