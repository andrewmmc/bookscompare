import assert from 'node:assert/strict'
import test from 'node:test'

import { fetchBooksComTwOffersByIsbn } from '../src/sources/books-com-tw'

test('fetchBooksComTwOffersByIsbn returns every parsed result', async (t) => {
  const html = `
    <!doctype html>
    <html lang="zh-Hant">
      <body>
        <div>搜尋結果共 <span>2</span> 筆</div>
        <table id="itemlist_table">
          <tbody id="itemlist_001">
            <tr>
              <td>
                <h4><a rel="mid_name" href="https://www.books.com.tw/products/001" title="測試書名：重構中的 API"></a></h4>
                <ul class="list-date clearfix">
                  <li><span>中文書</span></li>
                  <li>
                    <a rel="go_author" href="https://search.books.com.tw/search/query/key/%E6%B8%AC%E8%A9%A6%E4%BD%9C%E8%80%85">測試作者</a>,
                    <a href="https://www.books.com.tw/web/sys_puballb/books/?pubid=test-pub" title="測試出版社" rel="mid_publish">測試出版社</a>
                  </li>
                  <li>出版日期: 2026-04-26</li>
                </ul>
                <div class="txt_cont">
                  <p>第一本摘要。more</p>
                </div>
                <ul class="list-nav clearfix">
                  <li>優惠價: 79 折, 316 元</li>
                </ul>
                <input id="itemlist_001_price" value="316" />
                <img data-src="https://example.com/cover-1.jpg" />
                <div class="floated-btn-wrap">
                  <span>快速到貨</span>
                </div>
              </td>
            </tr>
          </tbody>
          <tbody id="itemlist_002">
            <tr>
              <td>
                <h4><a rel="mid_name" href="https://www.books.com.tw/products/002" title="測試書名：第二冊"></a></h4>
                <ul class="list-date clearfix">
                  <li><span>中文書</span></li>
                  <li>
                    <a rel="go_author" href="https://search.books.com.tw/search/query/key/%E7%AC%AC%E4%BA%8C%E4%BD%9C%E8%80%85">第二作者</a>,
                    <a href="https://www.books.com.tw/web/sys_puballb/books/?pubid=test-pub-2" title="第二出版社" rel="mid_publish">第二出版社</a>
                  </li>
                  <li>出版日期: 2026-04-27</li>
                </ul>
                <div class="txt_cont">
                  <p>第二本摘要。more</p>
                </div>
                <ul class="list-nav clearfix">
                  <li>優惠價: 88 折, 352 元</li>
                </ul>
                <input id="itemlist_002_price" value="352" />
                <img data-src="https://example.com/cover-2.jpg" />
                <div class="floated-btn-wrap">
                  <span>限量</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  `
  const originalFetch = globalThis.fetch

  t.after(() => {
    globalThis.fetch = originalFetch
  })

  globalThis.fetch = (async () => new Response(html, { status: 200 })) as typeof fetch

  const offers = await fetchBooksComTwOffersByIsbn('9786267569337')

  assert.equal(offers.length, 2)
  assert.deepEqual(offers.map((offer) => offer.sourceProductId), ['001', '002'])
})
