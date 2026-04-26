import assert from 'node:assert/strict'
import test from 'node:test'
import { setTimeout as delay } from 'node:timers/promises'

import type { BookOffer } from '@bookscompare/contracts'

import { providers } from '../src/providers/registry'
import { searchBooksByIsbn } from '../src/services/search-by-isbn'

import type { BookProvider } from '../src/providers/types'

function getBookProviders(): BookProvider[] {
  return providers.filter((provider): provider is BookProvider => 'searchByIsbn' in provider)
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
  }
}

test('searchBooksByIsbn runs provider lookups in parallel and preserves provider order', async (t) => {
  const bookProviders = getBookProviders()
  const originalSearchByIsbn = bookProviders.map((provider) => ({
    provider,
    searchByIsbn: provider.searchByIsbn,
  }))

  t.after(() => {
    for (const entry of originalSearchByIsbn) {
      entry.provider.searchByIsbn = entry.searchByIsbn
    }
  })

  for (const provider of bookProviders) {
    provider.searchByIsbn = async () => {
      switch (provider.id) {
        case 'books-com-tw':
          await delay(100)
          return [createOffer(provider)]
        case 'kingstone':
          await delay(80)
          throw new Error('Kingstone failed.')
        case 'cite':
          await delay(60)
          return []
        case 'eslite':
          await delay(40)
          return [createOffer(provider)]
      }
    }
  }

  const startedAt = Date.now()
  const response = await searchBooksByIsbn('9786267569337')
  const elapsedMs = Date.now() - startedAt

  assert.ok(elapsedMs < 170, `Expected parallel lookup under 170ms, got ${elapsedMs}ms.`)
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
  ])
  assert.deepEqual(response.data.map((offer) => offer.sourceId), ['books-com-tw', 'eslite'])
  assert.equal(response.meta.liveScraping, true)
  assert.equal(response.meta.message, 'One or more providers failed during ISBN search.')
})
