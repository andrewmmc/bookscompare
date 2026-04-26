import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

import { parseBooksComTwSearchResults } from '../src/sources/books-com-tw'

async function readFixture(name: string): Promise<string> {
  const filePath = fileURLToPath(new URL(`./fixtures/books-com-tw/${name}`, import.meta.url))

  return readFile(filePath, 'utf8')
}

test('parseBooksComTwSearchResults returns one normalized offer for found fixture', async () => {
  const html = await readFixture('found.html')
  const offers = parseBooksComTwSearchResults(html)

  assert.equal(offers.length, 1)
  assert.deepEqual(offers[0], {
    sourceId: 'books-com-tw',
    sourceName: '博客來',
    sourceProductId: '001',
    title: '測試書名：重構中的 API',
    productType: '中文書',
    authors: ['測試作者'],
    publisher: '測試出版社',
    publicationDate: '2026-04-26',
    summary: '這是一本用來驗證解析器的測試書籍。',
    price: 316,
    currency: 'TWD',
    priceText: '優惠價: 79 折, 316 元',
    discountRate: 79,
    url: 'https://www.books.com.tw/products/001',
    imageUrl: 'https://im2.book.com.tw/image/getImage?i=https://example.com/cover.jpg',
    previewUrl: 'https://www.books.com.tw/products/001?loc=preview',
    badges: ['快速到貨', '博客來獨家'],
  })
})

test('parseBooksComTwSearchResults returns empty array for not-found fixture', async () => {
  const html = await readFixture('not-found.html')

  assert.deepEqual(parseBooksComTwSearchResults(html), [])
})
