import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

import { parseEsliteSearchResults } from '../src/sources/eslite'

async function readFixture(name: string): Promise<Record<string, unknown>> {
  const filePath = fileURLToPath(new URL(`./fixtures/eslite/${name}`, import.meta.url))

  return JSON.parse(await readFile(filePath, 'utf8')) as Record<string, unknown>
}

test('parseEsliteSearchResults returns normalized offers from API payload', async () => {
  const payload = await readFixture('found.json')

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
      summary: '現代女目連救母，唐卡畫般眩目燦麗…… 鍾文音寫作生涯的重要轉折點， 活色生香又凌厲殘酷的最新長篇鉅著—— 死與生、空與色，人之大欲所在。 榮獲2021年台灣文學獎‧金典獎‧年度大獎 國藝會長篇小說專案獎助！ 王德威專文導讀 在愛苦之海之涯，人如何孤身而立？ 走回一個人，要跋涉多少長途，要跌倒多少岐路？ 鍾文音這回把前半生關注的「母」題，壯闊成一座令人目眩神迷的榮枯盛景， 彷彿滿山髑髏，都是她的過去色身。 她火力全開，燒盡血淚。以此送別，從此別送。 ／／ 病厄與情慾難分難捨，從病房到摩鐵，從人之將死到欲仙欲死……',
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

test('parseEsliteSearchResults returns empty array for empty payload', async () => {
  assert.deepEqual(parseEsliteSearchResults(await readFixture('not-found.json')), [])
})
