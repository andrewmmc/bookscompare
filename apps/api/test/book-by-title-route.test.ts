import assert from 'node:assert/strict';
import test from 'node:test';

import type { BookDetailResponse } from '@bookscompare/contracts';

import worker from '../src/index';

import {
  createExecutionContext,
  createTestEnv,
  createTestOffer,
  installFakeCaches,
  stubProviderSearch,
} from './helpers';

import type { BookProvider } from '../src/providers/types';

test('worker /book/by-title returns the matching cluster as a BookDetail', async (t) => {
  installFakeCaches(t);
  const { env } = createTestEnv();

  stubProviderSearch(t, 'searchByTitle', (provider) => async (title: string) => {
    if (provider.id === 'cite') {
      return [];
    }
    return [
      createTestOffer(provider, {
        title,
        authors: ['James Clear'],
        publisher: '方智',
        price: provider.id === 'kingstone' ? 250 : 320,
      }),
    ];
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

  stubProviderSearch(t, 'searchByTitle', (provider) => async (title: string) => {
    callCounts.set(provider.id, (callCounts.get(provider.id) ?? 0) + 1);
    return provider.id === 'books-com-tw'
      ? [
          createTestOffer(provider, {
            title,
            authors: ['James Clear'],
            publisher: '方智',
            price: 320,
          }),
        ]
      : [];
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

  stubProviderSearch(t, 'searchByTitle', (provider) => async (title: string) => {
    return [
      createTestOffer(provider, {
        title,
        authors: ['James Clear'],
        publisher: '方智',
        price: 320,
      }),
    ];
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
