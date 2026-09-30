import assert from 'node:assert/strict';
import test from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';

import { searchBooksByTitle } from '../src/services/search-by-title';

import { createTestOffer, stubProviderSearch } from './helpers';

test('searchBooksByTitle clusters offers across providers into full book entries', async (t) => {
  stubProviderSearch(t, 'searchByTitle', (provider) => async (title: string) => {
    switch (provider.id) {
      case 'books-com-tw':
        await delay(20);
        return [createTestOffer(provider, { title, price: 250 })];
      case 'kingstone':
        await delay(15);
        throw new Error('Kingstone failed.');
      case 'cite':
        await delay(10);
        return [];
      case 'eslite':
        await delay(5);
        return [createTestOffer(provider, { title, price: 200 })];
    }

    return [];
  });

  const response = await searchBooksByTitle('哈利波特');

  assert.deepEqual(response.query, { title: '哈利波特' });
  assert.equal(response.meta.liveScraping, true);
  assert.equal(response.meta.message, 'One or more providers failed during title search.');
  assert.deepEqual(
    response.sources.map((source) => ({ id: source.id, status: source.status })),
    [
      { id: 'books-com-tw', status: 'ready' },
      { id: 'kingstone', status: 'error' },
      { id: 'cite', status: 'ready' },
      { id: 'eslite', status: 'ready' },
    ]
  );
  const citeSource = response.sources.find((source) => source.id === 'cite');
  assert.equal(citeSource?.message, 'No 城邦讀書花園 search results matched this title.');

  // Both provider offers share title + first author, so they cluster into one
  // full book entry with two price-sorted offers.
  assert.equal(response.books.length, 1);
  const [book] = response.books;
  assert.equal(book?.title, '哈利波特');
  assert.deepEqual(book?.authors, ['Test Author']);
  assert.equal(book?.offers.length, 2);
  assert.equal(book?.offers[0]?.price, 200);
  assert.equal(book?.offers[0]?.url, 'https://example.com/eslite');
  assert.equal(book?.offers[1]?.price, 250);
  assert.equal(book?.isbn, undefined);
  assert.ok(book?.id.startsWith('t-'));
});

test('searchBooksByTitle excludes unrelated low-price provider results', async (t) => {
  stubProviderSearch(t, 'searchByTitle', (provider) => async () =>
    provider.id === 'books-com-tw'
      ? [
          createTestOffer(provider, { title: 'Unrelated cheap book', price: 45 }),
          createTestOffer(provider, { title: 'Machine Learning: The Complete Guide', price: 800 }),
        ]
      : []
  );

  const response = await searchBooksByTitle('Machine Learning');

  assert.equal(response.books.length, 1);
  assert.equal(response.books[0]?.title, 'Machine Learning: The Complete Guide');
});
