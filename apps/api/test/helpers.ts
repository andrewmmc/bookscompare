import type { BookOffer } from '@bookscompare/contracts';

import { providers } from '../src/providers/registry';

import type { BookProvider } from '../src/providers/types';

export function createExecutionContext() {
  const pending: Promise<unknown>[] = [];

  return {
    pending,
    waitUntil(promise: Promise<unknown>) {
      pending.push(promise);
    },
    passThroughOnException() {},
  } as ExecutionContext & { pending: Promise<unknown>[] };
}

export function createFakeCache() {
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

export function createTestEnv() {
  return {
    env: {} as Record<string, never>,
  };
}

export function installFakeCaches(t: { after: (fn: () => void) => void }) {
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

export function getBookProviders(): BookProvider[] {
  return providers.filter((provider): provider is BookProvider => 'searchByIsbn' in provider);
}

export function createTestOffer(
  provider: BookProvider,
  overrides: Partial<BookOffer> = {}
): BookOffer {
  const price = overrides.price ?? 100;

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
    currency: 'TWD',
    url: `https://example.com/${provider.id}`,
    imageUrl: `https://example.com/${provider.id}.jpg`,
    badges: [],
    ...overrides,
    price,
    priceText: overrides.priceText ?? `${price} 元`,
  };
}

export function stubProviderSearch<M extends 'searchByIsbn' | 'searchByTitle'>(
  t: { after: (fn: () => void) => void },
  method: M,
  factory: (provider: BookProvider) => BookProvider[M]
): BookProvider[] {
  const bookProviders = getBookProviders();
  const original = bookProviders.map((provider) => ({
    provider,
    impl: provider[method],
  }));

  t.after(() => {
    for (const entry of original) {
      entry.provider[method] = entry.impl;
    }
  });

  for (const provider of bookProviders) {
    provider[method] = factory(provider);
  }

  return bookProviders;
}
