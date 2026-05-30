import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { fetchBooksComTwOffers } from '../src/sources/books-com-tw';

async function readFixture(name: string): Promise<string> {
  const filePath = fileURLToPath(new URL(`./fixtures/books-com-tw/${name}`, import.meta.url));

  return readFile(filePath, 'utf8');
}

test('fetchBooksComTwOffers returns every parsed result', async (t) => {
  const html = await readFixture('found.html');
  const originalFetch = globalThis.fetch;

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = (async () => new Response(html, { status: 200 })) as typeof fetch;

  const offers = await fetchBooksComTwOffers('9786267569337');

  assert.equal(offers.length, 2);
  assert.deepEqual(
    offers.map((offer) => offer.sourceProductId),
    ['0011049950', 'E050329458']
  );
});

test('fetchBooksComTwOffers returns empty array for 404 responses', async (t) => {
  const originalFetch = globalThis.fetch;

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = (async () => new Response('missing', { status: 404 })) as typeof fetch;

  assert.deepEqual(await fetchBooksComTwOffers('9780000000000'), []);
});
