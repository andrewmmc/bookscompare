import { isValidIsbn, normalizeIsbn, type BookOffer } from '@bookscompare/contracts';

import { fetchWithTimeout } from '../lib/fetch-with-timeout';
import { hasEbookTitleMarker, normalizeBookTitle, normalizeWhitespace } from '../lib/html';
import { DEFAULT_ACCEPT_LANGUAGE, DEFAULT_SCRAPER_USER_AGENT } from './http-defaults';
import { DEFAULT_CURRENCY, parseSearchResultRows, sourceMeta } from './shared';

import type { ProviderSearchOptions } from '../providers/types';

const ESLITE_SOURCE_ID = 'eslite';
const ESLITE_SOURCE = sourceMeta(ESLITE_SOURCE_ID);
const ESLITE_SEARCH_URL = 'https://athena.eslite.com/api/v2/search?q=';
const ESLITE_BASE_URL = 'https://www.eslite.com';

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
  restricted?: string;
}

interface EsliteSearchHit {
  id?: string;
  fields?: EsliteSearchHitFields;
}

interface EsliteSearchResponse {
  hits?: {
    found?: string | number;
    hit?: EsliteSearchHit[] | null;
  } | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

// Missing or null `hits` / `hit` means no results, not a malformed payload.
function isEsliteSearchResponse(value: unknown): value is EsliteSearchResponse {
  if (!isRecord(value)) {
    return false;
  }

  const { hits } = value;

  if (hits === undefined || hits === null) {
    return true;
  }

  return isRecord(hits) && (hits.hit === undefined || hits.hit === null || Array.isArray(hits.hit));
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

  const sourceProductId = fields.eslite_sn || fields.isbn || fields.ean || hit.id;

  if (!sourceProductId) {
    throw new Error('Eslite parser could not determine the product id.');
  }

  const publisher = fields.manufacturer?.[0];

  if (!publisher) {
    throw new Error('Eslite parser could not find the publisher.');
  }

  if (!fields.product_photo_url) {
    throw new Error('Eslite parser could not find the cover image.');
  }

  const badges = fields.status === 'coming_soon_book' ? ['新書尚未入庫'] : [];
  const title = normalizeBookTitle(fields.name);
  const productType = hasEbookTitleMarker(fields.name) ? '電子書' : '中文書';
  const rawIsbn = fields.isbn || fields.ean;
  const isbn = rawIsbn ? normalizeIsbn(rawIsbn) : undefined;

  return {
    sourceId: ESLITE_SOURCE_ID,
    sourceName: ESLITE_SOURCE.name,
    sourceProductId,
    ...(isbn && isValidIsbn(isbn) ? { isbn } : {}),
    title,
    productType,
    authors: fields.author ?? [],
    publisher,
    publicationDate: parseEsliteDate(fields.manufacturer_date),
    summary: normalizeWhitespace(fields.description ?? ''),
    currency: DEFAULT_CURRENCY,
    url: toEsliteAbsoluteUrl(fields.url),
    imageUrl: toEsliteAbsoluteUrl(fields.product_photo_url),
    badges,
    ...parseEslitePrice(fields),
  };
}

export function parseEsliteSearchResults(payload: unknown, requestUrl?: string): BookOffer[] {
  if (!isEsliteSearchResponse(payload)) {
    throw new Error('Eslite returned an unexpected search payload.');
  }

  const hits = payload.hits?.hit ?? [];

  if (hits.length === 0) {
    return [];
  }

  const results = parseSearchResultRows({
    providerId: ESLITE_SOURCE_ID,
    ...(requestUrl ? { requestUrl } : {}),
    rows: hits,
    getBlock: (hit) => (hit.fields ? 'hit' : undefined),
    shouldSkip: (_block, hit) => hit.fields?.is_book === 'no' || hit.fields?.restricted === 'yes',
    parseOffer: (_block, hit) => parseEsliteOffer(hit),
    incompleteRowMessage: 'Eslite parser found a search result without fields.',
  });

  return results;
}

export async function fetchEsliteOffers(
  keyword: string,
  options: ProviderSearchOptions = {}
): Promise<BookOffer[]> {
  let response: Response;
  const url = `${ESLITE_SEARCH_URL}${encodeURIComponent(keyword)}`;

  try {
    response = await fetchWithTimeout(
      url,
      {
        headers: {
          accept: 'application/json',
          'accept-language': DEFAULT_ACCEPT_LANGUAGE,
          'user-agent': DEFAULT_SCRAPER_USER_AGENT,
        },
      },
      options.timeoutMs
    );
  } catch (error) {
    if (options.timeoutMs && error instanceof Error && error.name === 'TimeoutError') {
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

  return parseEsliteSearchResults(await response.json(), url);
}
