import assert from 'node:assert/strict';
import test from 'node:test';

import worker from '../src/index';

import {
  createExecutionContext,
  createTestEnv,
  createTestOffer,
  installFakeCaches,
  stubProviderSearch,
} from './helpers';

import type { BookProvider } from '../src/providers/types';

test('worker caches successful ISBN lookups under a canonical key', async (t) => {
  const callCounts = new Map<BookProvider['id'], number>();
  const { store } = installFakeCaches(t);
  const { env } = createTestEnv();

  stubProviderSearch(t, 'searchByIsbn', (provider) => async () => {
    callCounts.set(provider.id, (callCounts.get(provider.id) ?? 0) + 1);

    return provider.id === 'kingstone' ? [createTestOffer(provider)] : [];
  });

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
  const { store } = installFakeCaches(t);
  const { env } = createTestEnv();

  stubProviderSearch(t, 'searchByIsbn', (provider) => async () => {
    if (provider.id === 'kingstone') {
      throw new Error('Kingstone failed.');
    }

    return provider.id === 'books-com-tw' ? [createTestOffer(provider)] : [];
  });

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
