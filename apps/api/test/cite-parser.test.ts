import assert from 'node:assert/strict'
import test from 'node:test'

import { parseCiteSearchResults } from '../src/sources/cite'

test('parseCiteSearchResults returns normalized offers for live-style results', () => {
  const html = `
    <div class="book-container">
      <ul>
        <li class="book-area-1">
          <div class="book-img book_div">
            <a href="/book?id=106966" target="_self"><img src="//cdn.cite.com.tw/thumbs/3DP153C.jpg" /></a>
            <div class="two"><img alt="紙本書" src="/image/eb/e07.png" /></div>
          </div>
          <div class="book-info-area">
            <div class="book-info-1">
              <h2><a href="/book?id=106966" title="努爾的祕密圖書館（真實故事啟發，見證戰火下的勇氣與希望）" target="_self">《努爾的祕密圖書館（真實故事啟發，見證戰火下的勇氣與希望）》</a></h2>
              <div><b>類型：</b><span class="font-color-990">紙本書</span>&nbsp;&nbsp;<b>出版社：</b><span class="font-color-990 underline"><a href="/search_result?manufacturers=248" class="font-color-990">水滴文化</a></span>&nbsp;&nbsp;<b>出版日期：</b><span class="font-color-990">20260331</span></div>
              <div><b>書系：</b><span class="font-color-990 underline"><a href="/publisher/series/1386" class="font-color-990">繪本滴</a></span><b> 作者：</b><span class="font-color-990 underline"><a href="/search_result?authors_id=43350" id="writer" class="font-color-990">瓦法．塔爾諾夫斯卡</a></span></div>
              <div class="padding-top-10px"><strong>【內文簡介】</strong>★2024年安妮伊札德說書人選書獎★<br />一本在戰火中綻放希望的繪本<a href="https://www.cite.com.tw/book?id=106966" target="_self">...more &gt;&gt;</a></div>
            </div>
            <div class="book-info-2">
              <ul>
                <li>定價： 380 元</li>
                <li>優惠價： <span class="font-color01">79</span>折<span class="font-color01">300</span> 元</li>
              </ul>
            </div>
          </div>
          <div class="clear"></div>
        </li>
      </ul>
    </div>
    <ul class="page-numbers-2"></ul>
  `

  assert.deepEqual(parseCiteSearchResults(html), [
    {
      sourceId: 'cite',
      sourceName: '城邦讀書花園',
      sourceProductId: '106966',
      title: '努爾的祕密圖書館（真實故事啟發，見證戰火下的勇氣與希望）',
      productType: '紙本書',
      authors: ['瓦法．塔爾諾夫斯卡'],
      publisher: '水滴文化',
      publicationDate: '2026-03-31',
      summary: '★2024年安妮伊札德說書人選書獎★ 一本在戰火中綻放希望的繪本',
      price: 300,
      currency: 'TWD',
      priceText: '優惠價： 79 折 300 元',
      discountRate: 79,
      url: 'https://www.cite.com.tw/book?id=106966',
      imageUrl: 'https://cdn.cite.com.tw/thumbs/3DP153C.jpg',
      badges: [],
    },
  ])
})

test('parseCiteSearchResults returns empty array for live-style not-found page', () => {
  const html = `
    <div class="content-C">
      <ul class="welcome-list">
        <li><b>◎ 搜尋關鍵字：</b><span class="font-color01">9786267698390</span></li>
        <li><b>◎ 搜尋結果：</b>您輸入的搜尋條件，無符合的資料!</li>
      </ul>
      <div>請重新搜尋。</div>
    </div>
  `

  assert.deepEqual(parseCiteSearchResults(html), [])
})
