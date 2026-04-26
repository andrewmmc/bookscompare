import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

import { fetchCiteOffersByIsbn } from '../src/sources/cite'

async function readFixture(name: string): Promise<string> {
  const filePath = fileURLToPath(new URL(`./fixtures/cite/${name}`, import.meta.url))

  return readFile(filePath, 'utf8')
}

test('fetchCiteOffersByIsbn returns every parsed result', async (t) => {
  const html = await readFixture('found.html')
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

    if (url === 'https://www.cite.com.tw/search_result?keywords=9786267698396') {
      return new Response(html, { status: 200 })
    }

    throw new Error(`Unexpected URL: ${url}`)
  }) as typeof fetch

  const offers = await fetchCiteOffersByIsbn('9786267698396')

  assert.equal(offers.length, 1)
  assert.deepEqual(offers.map((offer) => offer.sourceProductId), ['107266'])
})
