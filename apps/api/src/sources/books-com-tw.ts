import type { BookOffer } from '@bookscompare/contracts'

import { decodeHtmlEntities, normalizeWhitespace, stripTags, toAbsoluteUrl } from '../lib/html'

const BOOKS_COM_TW_SOURCE_ID = 'books-com-tw'
const BOOKS_COM_TW_SOURCE_NAME = '博客來'
const BOOKS_COM_TW_SEARCH_URL = 'https://search.books.com.tw/search/query/cat/all/sort/1/v/0/page/1/spell/3/key/'
const BOOKS_COM_TW_CURRENCY = 'TWD'

const RESULT_BLOCK_PATTERN = /<tbody id="itemlist_(\d+)">([\s\S]*?)<\/tbody>/g
const RESULT_COUNT_PATTERN = /搜尋結果共\s*<span>(\d+)<\/span>\s*筆/

function matchFirst(pattern: RegExp, input: string): string | undefined {
  return pattern.exec(input)?.[1]
}

function extractAll(pattern: RegExp, input: string): string[] {
  return Array.from(input.matchAll(pattern), (match) => stripTags(match[1] ?? '')).filter(Boolean)
}

function parseDiscountRate(priceBlock: string): number | undefined {
  const value = matchFirst(/優惠價:\s*(\d+)\s*折/, priceBlock)

  return value ? Number(value) : undefined
}

function parsePrice(productId: string, block: string, priceBlock: string): number {
  const hiddenPrice = matchFirst(new RegExp(`<input[^>]*id="itemlist_${productId}_price"[^>]*value="(\\d+)"`), block)

  if (hiddenPrice) {
    return Number(hiddenPrice)
  }

  const displayedPrice = matchFirst(/優惠價:\s*\d+\s*折,\s*([\d,]+)\s*元/, priceBlock)

  if (displayedPrice) {
    return Number(displayedPrice.replaceAll(',', ''))
  }

  throw new Error(`Books.com.tw parser could not find a price for product ${productId}.`)
}

function parseSummary(block: string): string {
  const summaryHtml = matchFirst(/<div class="txt_cont">\s*<p>([\s\S]*?)<\/p>\s*<\/div>/, block)

  if (!summaryHtml) {
    return ''
  }

  return stripTags(summaryHtml).replace(/\s*more\s*$/i, '')
}

function parseProductType(block: string): string {
  const productType = matchFirst(/<ul class="list-date clearfix">[\s\S]*?<span>([^<]+)<\/span>/, block)

  if (!productType) {
    throw new Error('Books.com.tw parser could not find the product type.')
  }

  return stripTags(productType)
}

function parseTitleAndUrl(block: string): Pick<BookOffer, 'title' | 'url'> {
  const match = block.match(/<h4><a[^>]*rel="mid_name"[^>]*href="([^"]+)"[^>]*title="([^"]+)"/)

  if (!match) {
    throw new Error('Books.com.tw parser could not find the product title.')
  }

  const rawUrl = match[1]
  const rawTitle = match[2]

  if (!rawUrl || !rawTitle) {
    throw new Error('Books.com.tw parser returned an incomplete title link.')
  }

  return {
    title: decodeHtmlEntities(rawTitle),
    url: toAbsoluteUrl(rawUrl),
  }
}

function parsePublisher(block: string): string {
  const match = block.match(/area\/mid_publish[^>]*title="([^"]+)"/)

  const titleAttribute = match?.[1]

  if (titleAttribute) {
    return decodeHtmlEntities(titleAttribute)
  }

  const fallback = matchFirst(/<ul class="list-date clearfix">[\s\S]*?go_author[\s\S]*?,\s*<a[^>]*>([^<]+)<\/a>/, block)

  if (!fallback) {
    throw new Error('Books.com.tw parser could not find the publisher.')
  }

  return stripTags(fallback)
}

function parseImageUrl(block: string): string {
  const rawUrl = matchFirst(/<img[^>]*data-src="([^"]+)"/, block)

  if (!rawUrl) {
    throw new Error('Books.com.tw parser could not find the cover image.')
  }

  return toAbsoluteUrl(decodeHtmlEntities(rawUrl))
}

function parsePreviewUrl(block: string): string | undefined {
  const rawUrl = matchFirst(/<a[^>]*href="([^"]+)"[^>]*>\s*試閱\s*<\/a>/, block)

  return rawUrl ? toAbsoluteUrl(rawUrl) : undefined
}

function parsePublicationDate(block: string): string {
  const publicationDate = matchFirst(/出版日期:\s*(\d{4}-\d{2}-\d{2})/, block)

  if (!publicationDate) {
    throw new Error('Books.com.tw parser could not find the publication date.')
  }

  return publicationDate
}

function parsePriceText(block: string): string {
  const priceHtml = matchFirst(/<ul class="list-nav clearfix">\s*<li>([\s\S]*?)<\/li>\s*<\/ul>/, block)

  if (!priceHtml) {
    throw new Error('Books.com.tw parser could not find the price text.')
  }

  return normalizeWhitespace(stripTags(priceHtml))
}

function parseOffer(productId: string, block: string): BookOffer {
  const { title, url } = parseTitleAndUrl(block)
  const priceText = parsePriceText(block)
  const previewUrl = parsePreviewUrl(block)
  const discountRate = parseDiscountRate(priceText)
  const badgeGroup = matchFirst(/<div class="floated-btn-wrap">([\s\S]*?)<\/div>/, block) ?? ''

  return {
    sourceId: BOOKS_COM_TW_SOURCE_ID,
    sourceName: BOOKS_COM_TW_SOURCE_NAME,
    sourceProductId: productId,
    title,
    productType: parseProductType(block),
    authors: extractAll(/<a[^>]*rel=['"]go_author['"][^>]*>([\s\S]*?)<\/a>/g, block),
    publisher: parsePublisher(block),
    publicationDate: parsePublicationDate(block),
    summary: parseSummary(block),
    price: parsePrice(productId, block, priceText),
    currency: BOOKS_COM_TW_CURRENCY,
    priceText,
    ...(discountRate ? { discountRate } : {}),
    url,
    imageUrl: parseImageUrl(block),
    ...(previewUrl ? { previewUrl } : {}),
    badges: extractAll(/<span[^>]*>([\s\S]*?)<\/span>/g, badgeGroup),
  }
}

export function parseBooksComTwSearchResults(html: string): BookOffer[] {
  const resultCount = Number(matchFirst(RESULT_COUNT_PATTERN, html) ?? '0')
  const results = Array.from(html.matchAll(RESULT_BLOCK_PATTERN), (match) => {
    const productId = match[1]
    const block = match[2]

    if (!productId || !block) {
      throw new Error('Books.com.tw parser found an incomplete result row.')
    }

    return parseOffer(productId, block)
  })

  if (results.length === 0 && resultCount === 0) {
    return []
  }

  if (results.length === 0) {
    throw new Error('Books.com.tw parser could not find any search result rows.')
  }

  return results
}

export async function fetchBooksComTwOffersByIsbn(isbn: string): Promise<BookOffer[]> {
  const response = await fetch(`${BOOKS_COM_TW_SEARCH_URL}${encodeURIComponent(isbn)}`, {
    headers: {
      'accept-language': 'zh-TW,zh;q=0.9,en;q=0.8',
    },
  })

  if (!response.ok) {
    throw new Error(`Books.com.tw returned ${response.status}.`)
  }

  const html = await response.text()

  return parseBooksComTwSearchResults(html)
}
