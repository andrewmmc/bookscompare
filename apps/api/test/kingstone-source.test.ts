import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { fetchKingstoneOffers, parseKingstoneSearchResults } from '../src/sources/kingstone';

async function readFixture(name: string): Promise<string> {
  const filePath = fileURLToPath(new URL(`./fixtures/kingstone/${name}`, import.meta.url));

  return readFile(filePath, 'utf8');
}

test('parseKingstoneSearchResults returns search candidates for every matching result', async () => {
  const html = await readFixture('found.html');
  const offers = parseKingstoneSearchResults(html);

  assert.equal(offers.length, 2);
  assert.deepEqual(
    offers.map((offer) => ({
      sourceProductId: offer.sourceProductId,
      title: offer.title,
      productType: offer.productType,
      authors: offer.authors,
      publisher: offer.publisher,
      price: offer.price,
      priceText: offer.priceText,
      discountRate: offer.discountRate,
    })),
    [
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
        title: '機器學習：最強入門邁向AI高手．王者歸來',
        productType: '電子書',
        authors: ['洪錦魁'],
        publisher: '深智數位',
        price: 864,
        priceText: '8折 特價 864 元',
        discountRate: 80,
      },
    ]
  );
});

test('parseKingstoneSearchResults returns empty array for not-found fixture', async () => {
  const html = await readFixture('not-found.html');

  assert.deepEqual(parseKingstoneSearchResults(html), []);
});

test('parseKingstoneSearchResults returns empty array for current live not-found markup', async () => {
  const html = await readFixture('live-not-found.html');

  assert.deepEqual(parseKingstoneSearchResults(html), []);
});

test('parseKingstoneSearchResults throws when announced results cannot be parsed', () => {
  assert.throws(
    () => parseKingstoneSearchResults('全館搜尋共計 <span>1</span> 筆'),
    /could not find the main search result list/
  );

  assert.throws(
    () =>
      parseKingstoneSearchResults(`
        全館搜尋共計 <span>1</span> 筆
        <ul class="displaycol">
          <li class="displayunit"><h3 class="pdnamebox">missing link</h3></li>
        </ul>
      `),
    /could not parse any search result rows/
  );
});

test('fetchKingstoneOffers returns every normalized offer', async (t) => {
  const searchHtml = await readFixture('found.html');
  const originalFetch = globalThis.fetch;

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = (async (input) => {
    const url =
      typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

    if (url === 'https://www.kingstone.com.tw/search/key/9786267569337/dis/list?') {
      return new Response(searchHtml, { status: 200 });
    }

    throw new Error(`Unexpected URL: ${url}`);
  }) as typeof fetch;

  const offers = await fetchKingstoneOffers('9786267569337');
  const [firstOffer, secondOffer] = offers;

  assert.equal(offers.length, 2);
  assert.ok(firstOffer);
  assert.ok(secondOffer);
  assert.deepEqual(
    offers.map((offer) => ({
      sourceId: offer.sourceId,
      sourceName: offer.sourceName,
      sourceProductId: offer.sourceProductId,
      title: offer.title,
      productType: offer.productType,
      authors: offer.authors,
      publisher: offer.publisher,
      price: offer.price,
      currency: offer.currency,
      priceText: offer.priceText,
      discountRate: offer.discountRate,
      url: offer.url,
      imageUrl: offer.imageUrl,
      badges: offer.badges,
    })),
    [
      {
        sourceId: 'kingstone',
        sourceName: '金石堂',
        sourceProductId: '2013120720947',
        title: '機器學習：最強入門邁向AI高手王者歸來',
        productType: '中文書',
        authors: ['洪錦魁'],
        publisher: '深智數位',
        price: 972,
        currency: 'TWD',
        priceText: '9折 特價 972 元',
        discountRate: 90,
        url: 'https://www.kingstone.com.tw/basic/2013120720947/?lid=search&actid=WISE&kw=9786267569337',
        imageUrl:
          'https://cdn.kingstone.com.tw/book/images/product/20131/2013120720947/2013120720947m.jpg?v=0ae47',
        badges: [],
      },
      {
        sourceId: 'kingstone',
        sourceName: '金石堂',
        sourceProductId: '2800000134381',
        title: '機器學習：最強入門邁向AI高手．王者歸來',
        productType: '電子書',
        authors: ['洪錦魁'],
        publisher: '深智數位',
        price: 864,
        currency: 'TWD',
        priceText: '8折 特價 864 元',
        discountRate: 80,
        url: 'https://www.kingstone.com.tw/basic/2800000134381/?lid=search&actid=WISE&kw=9786267569337',
        imageUrl:
          'https://cdn.kingstone.com.tw/book/images/product/20131/2013120720947/2013120720947m.jpg?v=0ae47',
        badges: [],
      },
    ]
  );
  assert.equal(firstOffer.publicationDate, undefined);
  assert.equal(secondOffer.publicationDate, undefined);
  assert.match(firstOffer.summary, /演算法 \+ 真實案例 \+ 專題實作/);
  assert.match(secondOffer.summary, /演算法 \+ 真實案例 \+ 專題實作/);
});

test('fetchKingstoneOffers returns empty array for 404 responses', async (t) => {
  const originalFetch = globalThis.fetch;

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = (async () => new Response('missing', { status: 404 })) as typeof fetch;

  assert.deepEqual(await fetchKingstoneOffers('9780000000000'), []);
});
