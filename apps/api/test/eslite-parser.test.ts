import assert from 'node:assert/strict'
import test from 'node:test'

import { parseEsliteSearchResults } from '../src/sources/eslite'

test('parseEsliteSearchResults returns normalized offers from API payload', () => {
  const payload = {
    hits: {
      found: '1',
      hit: [
        {
          id: '10012013192683129498002',
          fields: {
            name: '別送 (新版)',
            description: '現代女目連救母，唐卡畫般眩目燦麗……\n\n鍾文音寫作生涯的重要轉折點。',
            final_price: '537',
            mprice: '680',
            url: 'https://www.eslite.com/product/10012013192683129498002',
            product_photo_url: '/b2b/newItem/2026/04/23/15138_112834247_313_mainCoverImage1.jpg',
            status: 'coming_soon_book',
            isbn: '9786264560092',
            ean: '9786264560092',
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

  assert.deepEqual(parseEsliteSearchResults(payload), [
    {
      sourceId: 'eslite',
      sourceName: '誠品線上',
      sourceProductId: '2683129498002',
      title: '別送 (新版)',
      productType: '中文書',
      authors: ['鍾文音'],
      publisher: '麥田出版社',
      publicationDate: '2026-04-30',
      summary: '現代女目連救母，唐卡畫般眩目燦麗…… 鍾文音寫作生涯的重要轉折點。',
      price: 537,
      currency: 'TWD',
      priceText: '79折 537 元',
      discountRate: 79,
      url: 'https://www.eslite.com/product/10012013192683129498002',
      imageUrl: 'https://www.eslite.com/b2b/newItem/2026/04/23/15138_112834247_313_mainCoverImage1.jpg',
      badges: ['新書尚未入庫'],
    },
  ])
})

test('parseEsliteSearchResults returns empty array for empty payload', () => {
  assert.deepEqual(parseEsliteSearchResults({ hits: { found: '0', hit: [] } }), [])
})
