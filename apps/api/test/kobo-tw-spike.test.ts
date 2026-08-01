import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { buildKoboTwSearchUrl, parseKoboProbePage, probeKoboTw } from '../src/spikes/kobo-tw';

async function fixture(name: string): Promise<string> {
  return readFile(new URL(`./fixtures/kobo-tw/${name}`, import.meta.url), 'utf8');
}

test('buildKoboTwSearchUrl pins searches to the Taiwan book storefront', () => {
  const url = new URL(buildKoboTwSearchUrl('原子習慣'));
  assert.equal(url.origin, 'https://www.kobo.com');
  assert.equal(url.pathname, '/tw/zh/search');
  assert.equal(url.searchParams.get('query'), '原子習慣');
  assert.equal(url.searchParams.get('fcmedia'), 'Book');
});

test('the Kobo spike parses title search cards and TWD prices', async () => {
  const result = parseKoboProbePage(
    await fixture('search.html'),
    'https://www.kobo.com/tw/zh/search?query=原子習慣'
  );

  assert.equal(result.pageKind, 'search');
  assert.equal(result.offers.length, 2);
  assert.deepEqual(result.offers[0], {
    sourceProductId: 'atomic-habits',
    title: '原子習慣',
    authors: ['James Clear'],
    price: 350,
    priceText: 'NT$350',
    currency: 'TWD',
    url: 'https://www.kobo.com/tw/zh/ebook/atomic-habits',
    imageUrl: 'https://cdn.kobo.com/atomic-habits.jpg',
    productType: '電子書',
  });
  assert.deepEqual(result.missingRequiredFields, ['publisher']);
});

test('the Kobo spike parses detail metadata and price from JSON-LD', async () => {
  const result = parseKoboProbePage(
    await fixture('detail.html'),
    'https://www.kobo.com/tw/zh/ebook/gHNJjsnWDDiOLJTKBIzxhg'
  );

  assert.equal(result.pageKind, 'detail');
  assert.deepEqual(result.missingRequiredFields, []);
  assert.deepEqual(result.offers[0], {
    sourceProductId: 'gHNJjsnWDDiOLJTKBIzxhg',
    isbn: '9786267492987',
    title: '一本書讀懂美元：9堂課解析美元邏輯',
    authors: ['白釋鉉'],
    publisher: '商業周刊',
    publicationDate: '2025-02-20',
    summary: '理解美元如何影響全球經濟。',
    price: 420,
    priceText: 'NT$420',
    currency: 'TWD',
    url: 'https://www.kobo.com/tw/zh/ebook/gHNJjsnWDDiOLJTKBIzxhg',
    imageUrl: 'https://cdn.kobo.com/book-images/us-dollar.jpg',
    productType: '電子書',
  });
});

test('the Kobo spike identifies Cloudflare challenge pages', async () => {
  const result = parseKoboProbePage(
    await fixture('challenge.html'),
    'https://www.kobo.com/tw/zh/search?query=9786267492987',
    403
  );

  assert.equal(result.challenged, true);
  assert.equal(result.pageKind, 'challenge');
  assert.deepEqual(result.offers, []);
});

test('probeKoboTw reports the final URL and challenge response', async () => {
  const html = await fixture('challenge.html');
  const fetchImpl: typeof fetch = async () => {
    const response = new Response(html, { status: 403 });
    Object.defineProperty(response, 'url', {
      value: 'https://www.kobo.com/tw/zh/search?query=9786267492987',
    });
    return response;
  };

  const result = await probeKoboTw('9786267492987', fetchImpl);

  assert.equal(result.status, 403);
  assert.equal(result.challenged, true);
  assert.match(result.requestUrl, /query=9786267492987/);
});
