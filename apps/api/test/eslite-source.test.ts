import assert from 'node:assert/strict'
import test from 'node:test'

import { fetchEsliteOffersByIsbn } from '../src/sources/eslite'

test('fetchEsliteOffersByIsbn returns parsed offers from the API', async (t) => {
  const payload = {
    hits: {
      found: '1',
      hit: [
        {
          id: '10012013192683129498002',
          fields: {
            name: '別送 (新版)',
            description: '現代女目連救母。',
            final_price: '537',
            mprice: '680',
            url: 'https://www.eslite.com/product/10012013192683129498002',
            product_photo_url: '/b2b/newItem/2026/04/23/15138_112834247_313_mainCoverImage1.jpg',
            status: 'coming_soon_book',
            isbn: '9786264560092',
            eslite_sn: '2683129498002',
            author: ['鍾文音'],
            manufacturer: ['麥田出版社'],
            manufacturer_date: '04/30/2026 00:00:00',
            is_book: 'yes',
          },
        },
      ],
    },
  }
  const originalFetch = globalThis.fetch

  t.after(() => {
    globalThis.fetch = originalFetch
  })

  globalThis.fetch = (async (input) => {
    const url = typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url

    if (url === 'https://athena.eslite.com/api/v2/search?q=9786264560092') {
      return Response.json(payload)
    }

    throw new Error(`Unexpected URL: ${url}`)
  }) as typeof fetch

  const offers = await fetchEsliteOffersByIsbn('9786264560092')

  assert.equal(offers.length, 1)
  assert.equal(offers[0]?.sourceProductId, '2683129498002')
})

test('fetchEsliteOffersByIsbn returns empty array when the API has no hits', async (t) => {
  const originalFetch = globalThis.fetch

  t.after(() => {
    globalThis.fetch = originalFetch
  })

  globalThis.fetch = (async () => Response.json({ hits: { found: '0', hit: [] } })) as typeof fetch

  assert.deepEqual(await fetchEsliteOffersByIsbn('9786267569330'), [])
})
