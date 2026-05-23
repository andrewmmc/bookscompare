import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { parseBooksComTwSearchResults } from '../src/sources/books-com-tw';

async function readFixture(name: string): Promise<string> {
  const filePath = fileURLToPath(new URL(`./fixtures/books-com-tw/${name}`, import.meta.url));

  return readFile(filePath, 'utf8');
}

test('parseBooksComTwSearchResults returns one normalized offer for found fixture', async () => {
  const html = await readFixture('found.html');
  const offers = parseBooksComTwSearchResults(html);

  assert.equal(offers.length, 2);
  assert.deepEqual(offers[0], {
    sourceId: 'books-com-tw',
    sourceName: '博客來',
    sourceProductId: '0011049950',
    title: '別送(新版)',
    productType: '中文書',
    authors: ['鍾文音'],
    publisher: '麥田',
    publicationDate: '2026-04-30',
    summary:
      '現代女目連救母，唐卡畫般眩目燦麗…… 鍾文音寫作生涯的重要轉折點， 活色生香又凌厲殘酷的最新長篇鉅著—— 死與生、空與色，人之大欲所在。 榮獲2021年台灣文學獎‧金典獎‧年度大獎 國藝會長篇小說專案...',
    price: 537,
    currency: 'TWD',
    priceText: '優惠價: 79 折, 537 元',
    discountRate: 79,
    url: 'https://search.books.com.tw/redirect/move/key/9786264560092/area/mid_name/item/0011049950/page/1/idx/1/cat/001/pdf/0/spell/3',
    imageUrl:
      'https://im1.book.com.tw/image/getImage?i=https://www.books.com.tw/img/001/104/99/0011049950.jpg&w=187&h=187&v=69e9a24b',
    badges: [],
  });
  assert.deepEqual(offers[1], {
    sourceId: 'books-com-tw',
    sourceName: '博客來',
    sourceProductId: 'E050329458',
    title: '別送(新版)',
    productType: '中文電子書',
    authors: ['鍾文音'],
    publisher: '麥田',
    publicationDate: '2026-04-30',
    summary:
      '現代女目連救母，唐卡畫般眩目燦麗…… 鍾文音寫作生涯的重要轉折點， 活色生香又凌厲殘酷的最新長篇鉅著—— 死與生、空與色，人之大欲所在。 榮獲2021年台灣文學獎‧金典獎‧年度大獎 國藝會長篇小說專案...',
    price: 476,
    currency: 'TWD',
    priceText: '優惠價: 476 元',
    url: 'https://search.books.com.tw/redirect/move/key/9786264560092/area/mid_name/item/E050329458/page/1/idx/2/cat/E05/pdf/0/spell/3',
    imageUrl:
      'https://im1.book.com.tw/image/getImage?i=https://www.books.com.tw/img/E05/032/94/E050329458.jpg&w=187&h=187&v=69e79c89',
    previewUrl:
      'https://search.books.com.tw/redirect/move/key/9786264560092/area/mid_epub/item/E050329458/page/1/epub/1/idx/2/cat/E05/pdf/0/spell/3',
    badges: [],
  });
});

test('parseBooksComTwSearchResults returns empty array for not-found fixture', async () => {
  const html = await readFixture('not-found.html');

  assert.deepEqual(parseBooksComTwSearchResults(html), []);
});
