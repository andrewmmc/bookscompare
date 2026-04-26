import assert from 'node:assert/strict'
import test from 'node:test'

import { fetchCiteOffersByIsbn } from '../src/sources/cite'

test('fetchCiteOffersByIsbn returns every parsed result', async (t) => {
  const html = `
    <div class="book-container">
      <ul>
        <li class="book-area-1">
          <div class="book-img book_div"><a href="/book?id=106966"><img src="//cdn.cite.com.tw/thumbs/3DP153C.jpg" /></a></div>
          <div class="book-info-area">
            <div class="book-info-1">
              <h2><a href="/book?id=106966" title="第一本書" target="_self">《第一本書》</a></h2>
              <div><b>類型：</b><span class="font-color-990">紙本書</span><b>出版社：</b><span class="font-color-990 underline"><a href="/publisher/about/248">測試出版社一</a></span><b>出版日期：</b><span class="font-color-990">20260426</span></div>
              <div><b> 作者：</b><span class="font-color-990 underline"><a href="/search_result?authors_id=1" id="writer" class="font-color-990">作者一</a></span></div>
              <div class="padding-top-10px"><strong>【內文簡介】</strong>第一本摘要<a href="https://www.cite.com.tw/book?id=106966">...more &gt;&gt;</a></div>
            </div>
            <div class="book-info-2"><ul><li>優惠價： <span class="font-color01">79</span>折<span class="font-color01">300</span> 元</li></ul></div>
          </div>
          <div class="clear"></div>
        </li>
        <li class="book-area-1">
          <div class="book-img book_div"><a href="/book?id=107327"><img src="//cdn.cite.com.tw/thumbs/3DP155C.jpg" /></a></div>
          <div class="book-info-area">
            <div class="book-info-1">
              <h2><a href="/book?id=107327" title="第二本書" target="_self">《第二本書》</a></h2>
              <div><b>類型：</b><span class="font-color-990">紙本書</span><b>出版社：</b><span class="font-color-990 underline"><a href="/publisher/about/248">測試出版社二</a></span><b>出版日期：</b><span class="font-color-990">20260427</span></div>
              <div><b> 作者：</b><span class="font-color-990 underline"><a href="/search_result?authors_id=2" id="writer" class="font-color-990">作者二</a></span></div>
              <div class="padding-top-10px"><strong>【內文簡介】</strong>第二本摘要<a href="https://www.cite.com.tw/book?id=107327">...more &gt;&gt;</a></div>
            </div>
            <div class="book-info-2"><ul><li>優惠價： <span class="font-color01">75</span>折<span class="font-color01">285</span> 元</li></ul></div>
          </div>
          <div class="clear"></div>
        </li>
      </ul>
    </div>
    <ul class="page-numbers-2"></ul>
  `
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

  assert.equal(offers.length, 2)
  assert.deepEqual(offers.map((offer) => offer.sourceProductId), ['106966', '107327'])
})
