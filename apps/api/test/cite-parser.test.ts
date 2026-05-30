import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { parseCiteSearchResults } from '../src/sources/cite';

async function readFixture(name: string): Promise<string> {
  const filePath = fileURLToPath(new URL(`./fixtures/cite/${name}`, import.meta.url));

  return readFile(filePath, 'utf8');
}

test('parseCiteSearchResults returns normalized offers for live-style results', async () => {
  const html = await readFixture('found.html');

  assert.deepEqual(parseCiteSearchResults(html), [
    {
      sourceId: 'cite',
      sourceName: '城邦讀書花園',
      sourceProductId: '107266',
      title: '別送(新版)',
      productType: '紙本書',
      authors: ['鍾文音'],
      publisher: '麥田',
      publicationDate: '2026-04-28',
      summary:
        '現代女目連救母，唐卡畫般眩目燦麗…… 鍾文音寫作生涯的重要轉折點， 活色生香又凌厲殘酷的最新長篇鉅著—— 死與生、空與色，人之大欲所在。 榮獲2021年台灣文學獎‧金典獎‧年度大獎 國藝會長篇小說專案獎助！ 王德威專文導讀 在愛苦之海之涯，人如何孤身而立？ 走回一個人，要跋涉多少長途，要跌倒多少岐路？ 鍾文音這回把前半生關注的「母」題，壯闊成一座令人目眩神迷的榮枯盛景， 彷彿滿山髑髏，都是她的過去色身。 她火力全開，燒盡血淚。以此送別，從此別送。 ／／ 病厄與情慾難分難捨，從病房到摩鐵，從人之',
      price: 537,
      currency: 'TWD',
      priceText: '優惠價： 79 折 537 元',
      discountRate: 79,
      url: 'https://www.cite.com.tw/book?id=107266',
      imageUrl: 'https://cdn.cite.com.tw/thumbs/RN3031X.jpg',
      badges: [],
    },
  ]);
});

test('parseCiteSearchResults returns empty array for live-style not-found page', async () => {
  const html = await readFixture('not-found.html');

  assert.deepEqual(parseCiteSearchResults(html), []);
});

test('parseCiteSearchResults throws when search result markup is incomplete', () => {
  assert.throws(
    () => parseCiteSearchResults('<main>results exist</main>'),
    /could not find the main search result list/
  );

  assert.throws(
    () =>
      parseCiteSearchResults(`
        <div class="book-container">
          <li class="book-area-1"><h2>missing link</h2><div class="clear"></div></li>
        <ul class="page-numbers-2">
      `),
    /could not parse any search result rows/
  );
});
