import type { BookOffer } from '@bookscompare/contracts';

import { fetchWithTimeout } from '../lib/fetch-with-timeout';
import { normalizeBookTitle } from '../lib/html';

import type { ProviderSearchOptions } from '../providers/types';

const ESLITE_SOURCE_ID = 'eslite';
const ESLITE_SOURCE_NAME = '誠品線上';
const ESLITE_SEARCH_URL = 'https://athena.eslite.com/api/v2/search?q=';
const ESLITE_BASE_URL = 'https://www.eslite.com';
const ESLITE_CURRENCY = 'TWD';
const ESLITE_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36';

interface EsliteSearchHitFields {
  name?: string;
  description?: string;
  final_price?: string;
  mprice?: string;
  url?: string;
  product_photo_url?: string;
  status?: string;
  isbn?: string;
  ean?: string;
  eslite_sn?: string;
  author?: string[];
  manufacturer?: string[];
  manufacturer_date?: string;
  is_book?: string;
}

interface EsliteSearchHit {
  id?: string;
  fields?: EsliteSearchHitFields;
}

interface EsliteSearchResponse {
  hits?: {
    found?: string | number;
    hit?: EsliteSearchHit[];
  };
}

function normalizeWhitespace(input: string): string {
  return input.replace(/\s+/g, ' ').trim();
}

function hasEbookTitleMarker(input: string): boolean {
  return /(^\s*(?:【|\[)\s*電子書\s*(?:】|\]))|([（(]\s*電子書\s*[）)]\s*$)/u.test(input);
}

function toEsliteAbsoluteUrl(url: string): string {
  return new URL(url, ESLITE_BASE_URL).toString();
}

function parseEsliteDate(input: string | undefined): string {
  if (!input) {
    throw new Error('Eslite parser could not find the publication date.');
  }

  const match = input.match(/(\d{2})\/(\d{2})\/(\d{4})/);

  if (!match) {
    throw new Error('Eslite parser returned an invalid publication date.');
  }

  const [, month, day, year] = match;

  return `${year}-${month}-${day}`;
}

function parseEslitePrice(
  fields: EsliteSearchHitFields
): Pick<BookOffer, 'price' | 'priceText' | 'discountRate'> {
  const rawFinalPrice = fields.final_price;

  if (!rawFinalPrice) {
    throw new Error('Eslite parser could not find the final price.');
  }

  const finalPrice = Number(rawFinalPrice.replaceAll(',', ''));

  if (Number.isNaN(finalPrice)) {
    throw new Error('Eslite parser returned an invalid final price.');
  }

  const rawOriginalPrice = fields.mprice;
  const originalPrice = rawOriginalPrice ? Number(rawOriginalPrice.replaceAll(',', '')) : undefined;
  const discountRate =
    originalPrice && originalPrice > 0 ? Math.round((finalPrice / originalPrice) * 100) : undefined;

  return {
    price: finalPrice,
    priceText: discountRate ? `${discountRate}折 ${finalPrice} 元` : `${finalPrice} 元`,
    ...(discountRate ? { discountRate } : {}),
  };
}

function parseEsliteOffer(hit: EsliteSearchHit): BookOffer {
  const fields = hit.fields;

  if (!fields) {
    throw new Error('Eslite parser found a search result without fields.');
  }

  if (fields.is_book === 'no') {
    throw new Error('Eslite parser encountered a non-book result.');
  }

  if (!fields.name) {
    throw new Error('Eslite parser could not find the product title.');
  }

  if (!fields.url) {
    throw new Error('Eslite parser could not find the product url.');
  }

  if (!fields.product_photo_url) {
    throw new Error('Eslite parser could not find the cover image.');
  }

  const publisher = fields.manufacturer?.[0];

  if (!publisher) {
    throw new Error('Eslite parser could not find the publisher.');
  }

  const sourceProductId = fields.eslite_sn ?? fields.isbn ?? fields.ean ?? hit.id;

  if (!sourceProductId) {
    throw new Error('Eslite parser could not determine the product id.');
  }

  const badges = fields.status === 'coming_soon_book' ? ['新書尚未入庫'] : [];
  const title = normalizeBookTitle(fields.name);
  const productType = hasEbookTitleMarker(fields.name) ? '電子書' : '中文書';

  return {
    sourceId: ESLITE_SOURCE_ID,
    sourceName: ESLITE_SOURCE_NAME,
    sourceProductId,
    title,
    productType,
    authors: fields.author ?? [],
    publisher,
    publicationDate: parseEsliteDate(fields.manufacturer_date),
    summary: normalizeWhitespace(fields.description ?? ''),
    currency: ESLITE_CURRENCY,
    url: toEsliteAbsoluteUrl(fields.url),
    imageUrl: toEsliteAbsoluteUrl(fields.product_photo_url),
    badges,
    ...parseEslitePrice(fields),
  };
}

export function parseEsliteSearchResults(payload: EsliteSearchResponse): BookOffer[] {
  const hits = payload.hits?.hit ?? [];

  if (hits.length === 0) {
    return [];
  }

  return hits.filter((hit) => hit.fields?.is_book !== 'no').map(parseEsliteOffer);
}

async function fetchEsliteOffersByKeyword(
  keyword: string,
  options: ProviderSearchOptions = {}
): Promise<BookOffer[]> {
  let response: Response;

  try {
    response = await fetchWithTimeout(
      `${ESLITE_SEARCH_URL}${encodeURIComponent(keyword)}`,
      {
        headers: {
          accept: 'application/json',
          'accept-language': 'zh-TW,zh;q=0.9,en;q=0.8',
          'user-agent': ESLITE_USER_AGENT,
        },
      },
      options.timeoutMs
    );
  } catch (error) {
    if (options.timeoutMs && error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Eslite timed out after ${options.timeoutMs}ms.`, { cause: error });
    }

    throw error;
  }

  if (response.status === 404) {
    return [];
  }

  if (!response.ok) {
    throw new Error(`Eslite returned ${response.status}.`);
  }

  return parseEsliteSearchResults((await response.json()) as EsliteSearchResponse);
}

export function fetchEsliteOffersByIsbn(
  isbn: string,
  options: ProviderSearchOptions = {}
): Promise<BookOffer[]> {
  return fetchEsliteOffersByKeyword(isbn, options);
}

export function fetchEsliteOffersByTitle(
  title: string,
  options: ProviderSearchOptions = {}
): Promise<BookOffer[]> {
  return fetchEsliteOffersByKeyword(title, options);
}
