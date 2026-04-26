import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

import { fetchEsliteOffersByIsbn } from '../src/sources/eslite'

async function readFixture(name: string): Promise<unknown> {
  const filePath = fileURLToPath(new URL(`./fixtures/eslite/${name}`, import.meta.url))

  return JSON.parse(await readFile(filePath, 'utf8')) as unknown
}

test('fetchEsliteOffersByIsbn returns parsed offers from the API', async (t) => {
  const payload = await readFixture('found.json')
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
  const payload = await readFixture('not-found.json')
  const originalFetch = globalThis.fetch

  t.after(() => {
    globalThis.fetch = originalFetch
  })

  globalThis.fetch = (async () => Response.json(payload)) as typeof fetch

  assert.deepEqual(await fetchEsliteOffersByIsbn('9786267569330'), [])
})
