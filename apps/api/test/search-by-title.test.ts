import assert from 'node:assert/strict';
import test from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';

import type { BookOffer } from '@bookscompare/contracts';

import { providers } from '../src/providers/registry';
import { searchBooksByTitle } from '../src/services/search-by-title';

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

test('searchBooksByTitle fans out to providers and returns title query metadata', async (t) => {
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
    provider.searchByTitle = async (title: string) => {
      switch (provider.id) {
        case 'books-com-tw':
          await delay(20);
          return [createOffer(provider, title)];
        case 'kingstone':
          await delay(15);
          throw new Error('Kingstone failed.');
        case 'cite':
          await delay(10);
          return [];
        case 'eslite':
          await delay(5);
          return [createOffer(provider, title)];
      }
    };
  }

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
  assert.deepEqual(
    response.data.map((offer) => offer.sourceId),
    ['books-com-tw', 'eslite']
  );
});
