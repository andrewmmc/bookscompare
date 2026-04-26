import type { BookOffer } from '@bookscompare/contracts'

import { fetchHtml } from '../lib/fetch-html'
import { decodeHtmlEntities, normalizeWhitespace, stripTags } from '../lib/html'

import type { ProviderSearchOptions } from '../providers/types'

const KINGSTONE_BASE_URL = 'https://www.kingstone.com.tw'
const KINGSTONE_SOURCE_ID = 'kingstone'
const KINGSTONE_SOURCE_NAME = '金石堂'
const KINGSTONE_SEARCH_URL = `${KINGSTONE_BASE_URL}/search/key/`
const KINGSTONE_CURRENCY = 'TWD'

const NO_RESULTS_PATTERN = /找不到與\s*[^\s]+\s*有關的結果/
const RESULT_COUNT_PATTERN = /全館搜尋共計\s*<span>(\d+)<\/span>\s*筆/
const RESULT_LIST_PATTERN = /<ul class="displaycol">([\s\S]*?)<\/ul>/
const RESULT_BLOCK_PATTERN = /<li class="displayunit">([\s\S]*?)<\/li>\s*(?=<li class="displayunit">|$)/g

interface KingstoneSearchOffer extends Omit<BookOffer, 'publicationDate'> {}

function matchFirst(pattern: RegExp, input: string): string | undefined {
  return pattern.exec(input)?.[1]
}

function extractAll(pattern: RegExp, input: string): string[] {
  return Array.from(input.matchAll(pattern), (match) => stripTags(match[1] ?? '')).filter(Boolean)
}

function toKingstoneAbsoluteUrl(url: string): string {
  return new URL(decodeHtmlEntities(url), KINGSTONE_BASE_URL).toString()
}

function normalizeKingstoneSummary(input: string): string {
  const summary = normalizeWhitespace(stripTags(input)).replace(/^https?:\/\/\S+\s*/i, '')
  const detailedSummary = summary.match(/內容簡介\s*([\s\S]*)/)

  return normalizeWhitespace(detailedSummary?.[1] ?? summary)
}

function parseKingstoneDiscountRate(block: string): number | undefined {
  const rawDiscountRate = matchFirst(/<b class="b1">(\d+)<\/b>\s*折/, block)

  if (!rawDiscountRate) {
    return undefined
  }

  const discountRate = Number(rawDiscountRate)

  return discountRate < 10 ? discountRate * 10 : discountRate
}

function parseKingstoneTitleAndUrl(block: string): Pick<KingstoneSearchOffer, 'sourceProductId' | 'title' | 'url'> {
  const match = block.match(/<h3 class="pdnamebox">\s*<a href="([^"]+)">([\s\S]*?)<\/a>\s*<\/h3>/)

  if (!match) {
    throw new Error('Kingstone parser could not find the product title.')
  }

  const rawUrl = match[1]
  const rawTitle = match[2]

  if (!rawUrl || !rawTitle) {
    throw new Error('Kingstone parser returned an incomplete title link.')
  }

  const url = toKingstoneAbsoluteUrl(rawUrl)
  const sourceProductId = new URL(url).pathname.match(/^\/basic\/([^/]+)/)?.[1]

  if (!sourceProductId) {
    throw new Error('Kingstone parser could not determine the product id.')
  }

  return {
    sourceProductId,
    title: stripTags(rawTitle),
    url,
  }
}

function parseKingstoneProductType(block: string): string {
  const productType = matchFirst(/<div class="classbox">\s*<span[^>]*>([^<]+)<\/span>/, block)

  if (!productType) {
    throw new Error('Kingstone parser could not find the product type.')
  }

  return stripTags(productType)
}

function parseKingstonePublisher(block: string): string {
  const publisherBlock = matchFirst(/<span class="publish">([\s\S]*?)<\/span>/, block)
  const publisher = publisherBlock ? matchFirst(/<a[^>]*>([\s\S]*?)<\/a>/, publisherBlock) : undefined

  if (!publisher) {
    throw new Error('Kingstone parser could not find the publisher.')
  }

  return stripTags(publisher)
}

function parseKingstoneImageUrl(block: string): string {
  const rawUrl = matchFirst(/<img[^>]*src="([^"]+)"/, block)

  if (!rawUrl) {
    throw new Error('Kingstone parser could not find the cover image.')
  }

  return toKingstoneAbsoluteUrl(rawUrl)
}

function parseKingstonePrice(block: string): Pick<BookOffer, 'price' | 'priceText' | 'discountRate'> {
  const rawPrice = matchFirst(/特價\s*<b>([\d,]+)<\/b>\s*元/, block)

  if (!rawPrice) {
    throw new Error('Kingstone parser could not find the price.')
  }

  const discountRate = parseKingstoneDiscountRate(block)

  return {
    price: Number(rawPrice.replaceAll(',', '')),
    priceText: discountRate ? `${discountRate / 10}折 特價 ${rawPrice} 元` : `特價 ${rawPrice} 元`,
    ...(discountRate ? { discountRate } : {}),
  }
}

function parseKingstoneSearchOffer(block: string): KingstoneSearchOffer {
  const { sourceProductId, title, url } = parseKingstoneTitleAndUrl(block)
  const authorBlock = matchFirst(/<span class="author">([\s\S]*?)<\/span>/, block) ?? ''
  const summaryHtml = matchFirst(/<p class="excerptbox">([\s\S]*?)<\/p>/, block)

  return {
    sourceId: KINGSTONE_SOURCE_ID,
    sourceName: KINGSTONE_SOURCE_NAME,
    sourceProductId,
    title,
    productType: parseKingstoneProductType(block),
    authors: extractAll(/<a[^>]*>([\s\S]*?)<\/a>/g, authorBlock),
    publisher: parseKingstonePublisher(block),
    summary: summaryHtml ? normalizeKingstoneSummary(summaryHtml) : '',
    currency: KINGSTONE_CURRENCY,
    url,
    imageUrl: parseKingstoneImageUrl(block),
    badges: [],
    ...parseKingstonePrice(block),
  }
}

function parseKingstonePublicationDate(html: string): string {
  const rawDate = matchFirst(/<span class="title_basic">出版日：<\/span>\s*(\d{4}\/\d{2}\/\d{2})/, html)
    ?? matchFirst(/"datePublished":"(\d{4}-\d{2}-\d{2})"/, html)

  if (!rawDate) {
    throw new Error('Kingstone parser could not find the publication date.')
  }

  return rawDate.replaceAll('/', '-')
}

function parseKingstoneDetailSummary(html: string): string {
  const summaryHtml = matchFirst(/<div class="pdintro_txt1field panelCon">\s*<span>([\s\S]*?)<\/span>\s*<\/div>/, html)

  return summaryHtml ? normalizeKingstoneSummary(summaryHtml) : ''
}

function buildKingstoneOffer(searchOffer: KingstoneSearchOffer, detailHtml: string): BookOffer {
  const summary = parseKingstoneDetailSummary(detailHtml)

  return {
    ...searchOffer,
    publicationDate: parseKingstonePublicationDate(detailHtml),
    summary: summary || searchOffer.summary,
  }
}

export function parseKingstoneSearchResults(html: string): KingstoneSearchOffer[] {
  const normalizedText = normalizeWhitespace(stripTags(html))

  if (NO_RESULTS_PATTERN.test(normalizedText)) {
    return []
  }

  const resultCount = Number(matchFirst(RESULT_COUNT_PATTERN, html) ?? '0')
  const resultList = matchFirst(RESULT_LIST_PATTERN, html)

  if (!resultList) {
    if (resultCount === 0) {
      return []
    }

    throw new Error('Kingstone parser could not find the main search result list.')
  }

  const results = Array.from(resultList.matchAll(RESULT_BLOCK_PATTERN), (match) => {
    const block = match[1]

    if (!block) {
      throw new Error('Kingstone parser found an incomplete result row.')
    }

    return parseKingstoneSearchOffer(block)
  })

  if (results.length === 0 && resultCount === 0) {
    return []
  }

  if (results.length === 0) {
    throw new Error('Kingstone parser could not find any search result rows.')
  }

  return results
}

export async function fetchKingstoneOffersByIsbn(isbn: string, options: ProviderSearchOptions = {}): Promise<BookOffer[]> {
  const html = await fetchHtml(`${KINGSTONE_SEARCH_URL}${encodeURIComponent(isbn)}/dis/list?`, {
    headers: {
      'accept-language': 'zh-TW,zh;q=0.9,en;q=0.8',
    },
    notFoundStatus: 404,
    errorLabel: 'Kingstone',
    ...(options.timeoutMs ? { timeoutMs: options.timeoutMs } : {}),
  })

  if (!html) {
    return []
  }

  const searchOffers = parseKingstoneSearchResults(html)

  if (searchOffers.length === 0) {
    return []
  }

  const settledOffers = await Promise.allSettled(searchOffers.map(async (searchOffer) => {
    const detailHtml = await fetchHtml(searchOffer.url, {
      headers: {
        'accept-language': 'zh-TW,zh;q=0.9,en;q=0.8',
      },
      notFoundStatus: 404,
      errorLabel: 'Kingstone',
      ...(options.timeoutMs ? { timeoutMs: options.timeoutMs } : {}),
    })

    if (!detailHtml) {
      throw new Error(`Kingstone detail page returned 404 for product ${searchOffer.sourceProductId}.`)
    }

    return buildKingstoneOffer(searchOffer, detailHtml)
  }))

  const offers = settledOffers.flatMap((result) => result.status === 'fulfilled' ? [result.value] : [])

  if (offers.length > 0) {
    return offers
  }

  throw new Error('Kingstone parser could not build any offers from the returned search results.')
}
