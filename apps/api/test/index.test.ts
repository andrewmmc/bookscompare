import assert from 'node:assert/strict';
import test from 'node:test';

import type { BookOffer } from '@bookscompare/contracts';

import worker from '../src/index';
import { providers } from '../src/providers/registry';

import type { BookProvider } from '../src/providers/types';

function getBookProviders(): BookProvider[] {
  return providers.filter((provider): provider is BookProvider => 'searchByIsbn' in provider);
}

function createOffer(provider: BookProvider): BookOffer {
  return {
    sourceId: provider.id,
    sourceName: provider.name,
    sourceProductId: `${provider.id}-offer`,
    title: `${provider.name} title`,
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

function createTestEnv() {
  return {
    env: {} as Record<string, never>,
  };
}

test('worker caches successful ISBN lookups under a canonical key', async (t) => {
  const bookProviders = getBookProviders();
  const originalSearchByIsbn = bookProviders.map((provider) => ({
    provider,
    searchByIsbn: provider.searchByIsbn,
  }));
  const callCounts = new Map<BookProvider['id'], number>();
  const { cache, store } = createFakeCache();
  const { env } = createTestEnv();
  const originalCaches = globalThis.caches;

  t.after(() => {
    for (const entry of originalSearchByIsbn) {
      entry.provider.searchByIsbn = entry.searchByIsbn;
    }

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

  Object.defineProperty(globalThis, 'caches', {
    value: { default: cache },
    configurable: true,
    writable: true,
  });

  for (const provider of bookProviders) {
    provider.searchByIsbn = async () => {
      callCounts.set(provider.id, (callCounts.get(provider.id) ?? 0) + 1);

      return provider.id === 'kingstone' ? [createOffer(provider)] : [];
    };
  }

  const firstContext = createExecutionContext();
  const firstResponse = await worker.fetch(
    new Request('https://bookscompare-api.andrewmmc.workers.dev/isbn/9786267569337'),
    env,
    firstContext
  );
  const firstBody = (await firstResponse.json()) as { meta: { requestedAt: string } };

  await Promise.all(firstContext.pending);

  assert.equal(firstResponse.headers.get('cache-control'), 'public, max-age=0, s-maxage=1800');
  assert.equal(firstResponse.headers.get('x-bookscompare-cache'), 'MISS');
  assert.equal(store.size, 1);
  assert.equal(
    store.values().next().value?.headers.get('x-bookscompare-cache'),
    null,
    'Cache status header should not be persisted in the stored response.'
  );
  assert.deepEqual(Object.fromEntries(callCounts), {
    'books-com-tw': 1,
    kingstone: 1,
    cite: 1,
    eslite: 1,
  });

  const secondContext = createExecutionContext();
  const secondResponse = await worker.fetch(
    new Request('https://bookscompare-api.andrewmmc.workers.dev/book/isbn/9786267569337'),
    env,
    secondContext
  );
  const secondBody = (await secondResponse.json()) as { meta: { requestedAt: string } };

  assert.equal(secondResponse.headers.get('cache-control'), 'public, max-age=0, s-maxage=1800');
  assert.equal(secondResponse.headers.get('x-bookscompare-cache'), 'HIT');
  assert.deepEqual(Object.fromEntries(callCounts), {
    'books-com-tw': 1,
    kingstone: 1,
    cite: 1,
    eslite: 1,
  });
  assert.equal(secondContext.pending.length, 0);
  assert.equal(secondBody.meta.requestedAt, firstBody.meta.requestedAt);
});

test('worker does not cache ISBN lookups when any provider fails', async (t) => {
  const bookProviders = getBookProviders();
  const originalSearchByIsbn = bookProviders.map((provider) => ({
    provider,
    searchByIsbn: provider.searchByIsbn,
  }));
  const { cache, store } = createFakeCache();
  const { env } = createTestEnv();
  const originalCaches = globalThis.caches;

  t.after(() => {
    for (const entry of originalSearchByIsbn) {
      entry.provider.searchByIsbn = entry.searchByIsbn;
    }

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

  Object.defineProperty(globalThis, 'caches', {
    value: { default: cache },
    configurable: true,
    writable: true,
  });

  for (const provider of bookProviders) {
    provider.searchByIsbn = async () => {
      if (provider.id === 'kingstone') {
        throw new Error('Kingstone failed.');
      }

      return provider.id === 'books-com-tw' ? [createOffer(provider)] : [];
    };
  }

  const context = createExecutionContext();
  const response = await worker.fetch(
    new Request('https://bookscompare-api.andrewmmc.workers.dev/isbn/9786267569337'),
    env,
    context
  );
  const body = (await response.json()) as { meta: { message?: string } };

  await Promise.all(context.pending);

  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('x-bookscompare-cache'), 'MISS');
  assert.equal(store.size, 0);
  assert.equal(body.meta.message, 'One or more providers failed during ISBN search.');
});
