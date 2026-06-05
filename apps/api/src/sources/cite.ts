import type { BookOffer } from '@bookscompare/contracts';

import { fetchHtml } from '../lib/fetch-html';
import {
  decodeHtmlEntities,
  extractAll,
  matchFirst,
  normalizeWhitespace,
  stripTags,
} from '../lib/html';
import { DEFAULT_CURRENCY, parseSearchResultRows, sourceMeta } from './shared';

import type { ProviderSearchOptions } from '../providers/types';

const CITE_BASE_URL = 'https://www.cite.com.tw';
const CITE_SOURCE_ID = 'cite';
const CITE_SOURCE = sourceMeta(CITE_SOURCE_ID);
const CITE_SEARCH_URL = `${CITE_BASE_URL}/search_result?keywords=`;
const CITE_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36';

const NO_RESULTS_PATTERN = /您輸入的搜尋條件，無符合的資料[!！]/;
const RESULT_CONTAINER_PATTERN =
  /<div class="book-container">([\s\S]*?)<ul class="page-numbers-2">/;
const RESULT_BLOCK_PATTERN =
  /<li class="book-area-1">([\s\S]*?)<div class="clear"><\/div>\s*<\/li>/g;

function toCiteAbsoluteUrl(url: string): string {
  return new URL(decodeHtmlEntities(url), CITE_BASE_URL).toString();
}

function normalizeCiteTitle(input: string): string {
  const normalizedTitle = normalizeWhitespace(stripTags(input));
  const wrappedTitle = normalizedTitle.match(/^《(.+)》$/);

  return wrappedTitle?.[1] ?? normalizedTitle;
}

function normalizeCitePublicationDate(input: string): string {
  if (/^\d{8}$/.test(input)) {
    return `${input.slice(0, 4)}-${input.slice(4, 6)}-${input.slice(6, 8)}`;
  }

  return input;
}

function parseCiteTitleAndUrl(block: string): Pick<BookOffer, 'sourceProductId' | 'title' | 'url'> {
  const match = block.match(/<h2>\s*<a href="([^"]+)"[^>]*title="([^"]+)"/);

  if (!match) {
    throw new Error('Cite parser could not find the product title.');
  }

  const rawUrl = match[1];
  const rawTitle = match[2];

  if (!rawUrl || !rawTitle) {
    throw new Error('Cite parser returned an incomplete title link.');
  }

  const url = toCiteAbsoluteUrl(rawUrl);
  const sourceProductId = new URL(url).searchParams.get('id');

  if (!sourceProductId) {
    throw new Error('Cite parser could not determine the product id.');
  }

  return {
    sourceProductId,
    title: normalizeCiteTitle(rawTitle),
    url,
  };
}

function parseCiteProductType(block: string): string {
  const productType = matchFirst(/<b>\s*類型：<\/b>\s*<span[^>]*>([^<]+)<\/span>/, block);

  if (!productType) {
    throw new Error('Cite parser could not find the product type.');
  }

  return stripTags(productType);
}

function parseCitePublisher(block: string): string {
  const publisher = matchFirst(/<b>\s*出版社：<\/b>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/, block);

  if (!publisher) {
    throw new Error('Cite parser could not find the publisher.');
  }

  return stripTags(publisher);
}

function parseCitePublicationDate(block: string): string {
  const publicationDate = matchFirst(
    /<b>\s*出版日期：<\/b>\s*<span[^>]*>(\d{8}|\d{4}-\d{2}-\d{2})<\/span>/,
    block
  );

  if (!publicationDate) {
    throw new Error('Cite parser could not find the publication date.');
  }

  return normalizeCitePublicationDate(publicationDate);
}

function parseCiteSummary(block: string): string {
  const summaryHtml = matchFirst(
    /<strong>【內文簡介】<\/strong>([\s\S]*?)(?:<a href="[^"]+"[^>]*>\s*\.\.\.more[\s\S]*?<\/a>|<\/div>)/,
    block
  );

  if (!summaryHtml) {
    return '';
  }

  return normalizeWhitespace(stripTags(summaryHtml));
}

function parseCiteImageUrl(block: string): string {
  const rawUrl = matchFirst(/<div class="book-img book_div">[\s\S]*?<img src="([^"]+)"/, block);

  if (!rawUrl) {
    throw new Error('Cite parser could not find the cover image.');
  }

  return toCiteAbsoluteUrl(rawUrl);
}

function parseCitePrice(block: string): Pick<BookOffer, 'price' | 'priceText' | 'discountRate'> {
  const priceHtml = matchFirst(/<li>\s*(優惠價：[\s\S]*?)<\/li>/, block);

  if (!priceHtml) {
    throw new Error('Cite parser could not find the price.');
  }

  const priceText = normalizeWhitespace(stripTags(priceHtml));
  const rawPrice = matchFirst(/(?:優惠價：\s*\d+\s*折\s*)?([\d,]+)\s*元/, priceText);

  if (!rawPrice) {
    throw new Error('Cite parser could not parse the price text.');
  }

  const rawDiscountRate = matchFirst(/優惠價：\s*(\d+)\s*折/, priceText);
  const discountRate = rawDiscountRate ? Number(rawDiscountRate) : undefined;

  return {
    price: Number(rawPrice.replaceAll(',', '')),
    priceText,
    ...(discountRate ? { discountRate } : {}),
  };
}

function parseCiteOffer(block: string): BookOffer {
  const { sourceProductId, title, url } = parseCiteTitleAndUrl(block);

  return {
    sourceId: CITE_SOURCE_ID,
    sourceName: CITE_SOURCE.name,
    sourceProductId,
    title,
    productType: parseCiteProductType(block),
    authors: extractAll(/<a[^>]*id="writer"[^>]*>([\s\S]*?)<\/a>/g, block),
    publisher: parseCitePublisher(block),
    publicationDate: parseCitePublicationDate(block),
    summary: parseCiteSummary(block),
    currency: DEFAULT_CURRENCY,
    url,
    imageUrl: parseCiteImageUrl(block),
    badges: [],
    ...parseCitePrice(block),
  };
}

export function parseCiteSearchResults(html: string, requestUrl?: string): BookOffer[] {
  const normalizedText = normalizeWhitespace(stripTags(html));

  if (NO_RESULTS_PATTERN.test(normalizedText)) {
    return [];
  }

  const resultContainer = matchFirst(RESULT_CONTAINER_PATTERN, html);

  if (!resultContainer) {
    throw new Error('Cite parser could not find the main search result list.');
  }

  const rows = Array.from(resultContainer.matchAll(RESULT_BLOCK_PATTERN));
  const results = parseSearchResultRows({
    providerId: CITE_SOURCE_ID,
    ...(requestUrl ? { requestUrl } : {}),
    rows,
    getBlock: (match) => match[1],
    shouldSkip: (block) => block.includes('/images/adults_only.png'),
    parseOffer: parseCiteOffer,
    incompleteRowMessage: 'Cite parser found an incomplete result row.',
  });

  if (results.length === 0) {
    throw new Error('Cite parser could not parse any search result rows.');
  }

  return results;
}

export async function fetchCiteOffers(
  keyword: string,
  options: ProviderSearchOptions = {}
): Promise<BookOffer[]> {
  const url = `${CITE_SEARCH_URL}${encodeURIComponent(keyword)}`;
  const html = await fetchHtml(url, {
    headers: {
      'accept-language': 'zh-TW,zh;q=0.9,en;q=0.8',
      'user-agent': CITE_USER_AGENT,
    },
    notFoundStatus: 404,
    errorLabel: 'Cite',
    ...(options.timeoutMs ? { timeoutMs: options.timeoutMs } : {}),
  });

  if (!html) {
    return [];
  }

  return parseCiteSearchResults(html, url);
}
