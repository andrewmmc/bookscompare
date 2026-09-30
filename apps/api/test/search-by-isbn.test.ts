import assert from 'node:assert/strict';
import test from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';

import { searchBooksByIsbn } from '../src/services/search-by-isbn';

import { createTestOffer, stubProviderSearch } from './helpers';

test('searchBooksByIsbn runs provider lookups in parallel and returns a clustered book detail', async (t) => {
  stubProviderSearch(t, 'searchByIsbn', (provider) => async () => {
    switch (provider.id) {
      case 'books-com-tw':
        await delay(100);
        return [createTestOffer(provider, { title: 'Shared title' })];
      case 'kingstone':
        await delay(80);
        throw new Error('Kingstone failed.');
      case 'cite':
        await delay(60);
        return [];
      case 'eslite':
        await delay(40);
        return [createTestOffer(provider, { title: 'Shared title' })];
    }

    return [];
  });

  const startedAt = Date.now();
  const response = await searchBooksByIsbn('9786267569337');
  const elapsedMs = Date.now() - startedAt;

  assert.ok(elapsedMs < 170, `Expected parallel lookup under 170ms, got ${elapsedMs}ms.`);
  assert.deepEqual(response.sources, [
    {
      id: 'books-com-tw',
      name: '博客來',
      status: 'ready',
    },
    {
      id: 'kingstone',
      name: '金石堂',
      status: 'error',
      message: 'Kingstone failed.',
    },
    {
      id: 'cite',
      name: '城邦讀書花園',
      status: 'ready',
      message: 'No 城邦讀書花園 search results matched this ISBN.',
    },
    {
      id: 'eslite',
      name: '誠品線上',
      status: 'ready',
    },
  ]);
  assert.deepEqual(response.query, { isbn: '9786267569337' });
  assert.equal(response.book?.id, '9786267569337');
  assert.equal(response.book?.isbn, '9786267569337');
  assert.deepEqual(
    response.book?.offers.map((offer) => offer.sourceId),
    ['books-com-tw', 'eslite']
  );
  assert.equal(
    response.book?.offers.every((offer) => offer.isbn === undefined),
    true
  );
  assert.equal(response.meta.liveScraping, true);
  assert.equal(response.meta.message, 'One or more providers failed during ISBN search.');
});

test('searchBooksByIsbn rejects offers carrying a different ISBN', async (t) => {
  stubProviderSearch(
    t,
    'searchByIsbn',
    (provider) => async () =>
      provider.id === 'eslite'
        ? [
            { ...createTestOffer(provider, { title: 'Shared title' }), isbn: '9786267569337' },
            {
              ...createTestOffer(provider, { title: 'Shared title' }),
              sourceProductId: 'wrong-edition',
              isbn: '9786264560092',
            },
          ]
        : []
  );

  const response = await searchBooksByIsbn('9786267569337');

  assert.deepEqual(
    response.book?.offers.map((offer) => offer.sourceProductId),
    ['eslite-offer']
  );
  assert.equal(response.sources.find((source) => source.id === 'eslite')?.message, undefined);
});

test('searchBooksByIsbn reports a provider as empty when all its offers mismatch', async (t) => {
  stubProviderSearch(
    t,
    'searchByIsbn',
    (provider) => async () =>
      provider.id === 'eslite'
        ? [{ ...createTestOffer(provider, { title: 'Shared title' }), isbn: '9786264560092' }]
        : []
  );

  const response = await searchBooksByIsbn('9786267569337');
  assert.equal(
    response.sources.find((source) => source.id === 'eslite')?.message,
    'No 誠品線上 search results matched this ISBN.'
  );
});

test('searchBooksByIsbn accepts the equivalent ISBN-10 for an ISBN-13 query', async (t) => {
  stubProviderSearch(
    t,
    'searchByIsbn',
    (provider) => async () =>
      provider.id === 'eslite'
        ? [{ ...createTestOffer(provider, { title: 'Shared title' }), isbn: '0306406152' }]
        : []
  );

  const response = await searchBooksByIsbn('9780306406157');
  assert.equal(response.book?.offers[0]?.isbn, '0306406152');
});

test('searchBooksByIsbn rejects ambiguous ISBN-less title clusters', async (t) => {
  stubProviderSearch(
    t,
    'searchByIsbn',
    (provider) => async () =>
      provider.id === 'eslite'
        ? [
            createTestOffer(provider, { title: 'Shared title' }),
            {
              ...createTestOffer(provider, { title: 'Shared title' }),
              sourceProductId: 'other',
              title: 'Other title',
            },
          ]
        : []
  );

  const response = await searchBooksByIsbn('9786267569337');
  assert.equal(response.book, null);
});
