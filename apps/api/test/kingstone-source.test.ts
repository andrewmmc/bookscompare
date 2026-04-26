import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

import { fetchKingstoneOffersByIsbn, parseKingstoneSearchResults } from '../src/sources/kingstone'

async function readFixture(name: string): Promise<string> {
  const filePath = fileURLToPath(new URL(`./fixtures/kingstone/${name}`, import.meta.url))

  return readFile(filePath, 'utf8')
}

test('parseKingstoneSearchResults returns search candidates for every matching result', async () => {
  const html = await readFixture('found.html')
  const offers = parseKingstoneSearchResults(html)

  assert.equal(offers.length, 2)
  assert.deepEqual(offers.map((offer) => ({
    sourceProductId: offer.sourceProductId,
    title: offer.title,
    productType: offer.productType,
    authors: offer.authors,
    publisher: offer.publisher,
    price: offer.price,
    priceText: offer.priceText,
    discountRate: offer.discountRate,
  })), [
    {
      sourceProductId: '2013120720947',
      title: '機器學習：最強入門邁向AI高手王者歸來',
      productType: '中文書',
      authors: ['洪錦魁'],
      publisher: '深智數位',
      price: 972,
      priceText: '9折 特價 972 元',
      discountRate: 90,
    },
    {
      sourceProductId: '2800000134381',
      title: '【電子書】機器學習：最強入門邁向AI高手．王者歸來',
      productType: '電子書',
      authors: ['洪錦魁'],
      publisher: '深智數位',
      price: 864,
      priceText: '8折 特價 864 元',
      discountRate: 80,
    },
  ])
})

test('parseKingstoneSearchResults returns empty array for not-found fixture', async () => {
  const html = await readFixture('not-found.html')

  assert.deepEqual(parseKingstoneSearchResults(html), [])
})

test('parseKingstoneSearchResults returns empty array for current live not-found markup', async () => {
  const html = await readFixture('live-not-found.html')

  assert.deepEqual(parseKingstoneSearchResults(html), [])
})

test('fetchKingstoneOffersByIsbn returns every normalized offer', async (t) => {
  const searchHtml = await readFixture('found.html')
  const detailBookHtml = await readFixture('detail-book.html')
  const detailEbookHtml = await readFixture('detail-ebook.html')
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

    if (url === 'https://www.kingstone.com.tw/search/key/9786267569337/dis/list?') {
      return new Response(searchHtml, { status: 200 })
    }

    if (url.startsWith('https://www.kingstone.com.tw/basic/2013120720947/')) {
      return new Response(detailBookHtml, { status: 200 })
    }

    if (url.startsWith('https://www.kingstone.com.tw/basic/2800000134381/')) {
      return new Response(detailEbookHtml, { status: 200 })
    }

    throw new Error(`Unexpected URL: ${url}`)
  }) as typeof fetch

  const offers = await fetchKingstoneOffersByIsbn('9786267569337')
  const [firstOffer, secondOffer] = offers

  assert.equal(offers.length, 2)
  assert.ok(firstOffer)
  assert.ok(secondOffer)
  assert.deepEqual(offers.map((offer) => ({
    sourceId: offer.sourceId,
    sourceName: offer.sourceName,
    sourceProductId: offer.sourceProductId,
    title: offer.title,
    productType: offer.productType,
    authors: offer.authors,
    publisher: offer.publisher,
    publicationDate: offer.publicationDate,
    price: offer.price,
    currency: offer.currency,
    priceText: offer.priceText,
    discountRate: offer.discountRate,
    url: offer.url,
    imageUrl: offer.imageUrl,
    badges: offer.badges,
  })), [
    {
      sourceId: 'kingstone',
      sourceName: '金石堂',
      sourceProductId: '2013120720947',
      title: '機器學習：最強入門邁向AI高手王者歸來',
      productType: '中文書',
      authors: ['洪錦魁'],
      publisher: '深智數位',
      publicationDate: '2024-12-23',
      price: 972,
      currency: 'TWD',
      priceText: '9折 特價 972 元',
      discountRate: 90,
      url: 'https://www.kingstone.com.tw/basic/2013120720947/?lid=search&actid=WISE&kw=9786267569337',
      imageUrl: 'https://cdn.kingstone.com.tw/book/images/product/20131/2013120720947/2013120720947m.jpg?v=0ae47',
      badges: [],
    },
    {
      sourceId: 'kingstone',
      sourceName: '金石堂',
      sourceProductId: '2800000134381',
      title: '【電子書】機器學習：最強入門邁向AI高手．王者歸來',
      productType: '電子書',
      authors: ['洪錦魁'],
      publisher: '深智數位',
      publicationDate: '2024-12-23',
      price: 864,
      currency: 'TWD',
      priceText: '8折 特價 864 元',
      discountRate: 80,
      url: 'https://www.kingstone.com.tw/basic/2800000134381/?lid=search&actid=WISE&kw=9786267569337',
      imageUrl: 'https://cdn.kingstone.com.tw/book/images/product/20131/2013120720947/2013120720947m.jpg?v=0ae47',
      badges: [],
    },
  ])
  assert.match(firstOffer.summary, /AI時代的學習革命：用最簡單的方式掌握機器學習。/)
  assert.match(secondOffer.summary, /AI時代的學習革命：用最簡單的方式掌握機器學習。/)
})
