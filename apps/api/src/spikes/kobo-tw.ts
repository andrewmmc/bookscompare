import { decodeHtmlEntities, normalizeWhitespace, stripTags } from '../lib/html';

const KOBO_TW_BASE_URL = 'https://www.kobo.com';
const KOBO_TW_SEARCH_URL = `${KOBO_TW_BASE_URL}/tw/zh/search`;
const KOBO_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36';

export interface KoboProbeOffer {
  sourceProductId?: string;
  isbn?: string;
  title?: string;
  authors: string[];
  publisher?: string;
  publicationDate?: string;
  summary?: string;
  price?: number;
  priceText?: string;
  currency?: string;
  url?: string;
  imageUrl?: string;
  productType: '電子書';
}

export interface KoboProbeResult {
  query: string;
  requestUrl: string;
  finalUrl: string;
  status: number;
  challenged: boolean;
  pageKind: 'challenge' | 'detail' | 'search' | 'unknown';
  offers: KoboProbeOffer[];
  missingRequiredFields: string[];
}

type JsonRecord = Record<string, unknown>;

export function buildKoboTwSearchUrl(query: string): string {
  const url = new URL(KOBO_TW_SEARCH_URL);
  url.searchParams.set('query', query);
  url.searchParams.set('fcmedia', 'Book');
  return url.toString();
}

function isRecord(value: unknown): value is JsonRecord {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function stringValue(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) {
    return normalizeWhitespace(decodeHtmlEntities(value));
  }

  if (isRecord(value)) {
    return stringValue(value.name);
  }

  return undefined;
}

function stringArray(value: unknown): string[] {
  const values = Array.isArray(value) ? value : value == null ? [] : [value];
  return values.map(stringValue).filter((item): item is string => Boolean(item));
}

function absoluteKoboUrl(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  try {
    return new URL(value, KOBO_TW_BASE_URL).toString();
  } catch {
    return undefined;
  }
}

function productIdFromUrl(url: string | undefined): string | undefined {
  return url?.match(/\/ebook\/([^/?#]+)/)?.[1];
}

function parsePrice(
  value: unknown,
  currency?: string
): Pick<KoboProbeOffer, 'price' | 'priceText'> {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return { price: value, priceText: `${currency === 'TWD' ? 'NT$' : ''}${value}` };
  }

  if (typeof value !== 'string') {
    return {};
  }

  const match = value.replaceAll(',', '').match(/(?:NT\$|TWD|\$)?\s*(\d+(?:\.\d+)?)/i);
  const price = match?.[1] ? Number(match[1]) : Number.NaN;
  const normalizedValue = normalizeWhitespace(value);
  const priceText = /(?:NT\$|TWD|\$)/i.test(normalizedValue)
    ? normalizedValue
    : `${currency === 'TWD' ? 'NT$' : ''}${normalizedValue}`;
  return Number.isFinite(price) ? { price, priceText } : {};
}

function firstJsonLdOffer(value: unknown, pageUrl: string): KoboProbeOffer | undefined {
  if (Array.isArray(value)) {
    for (const item of value) {
      const offer = firstJsonLdOffer(item, pageUrl);
      if (offer) return offer;
    }
    return undefined;
  }

  if (!isRecord(value)) {
    return undefined;
  }

  const type = stringArray(value['@type']);
  const looksLikeBook = type.some((item) => item === 'Book' || item === 'Product');

  if (!looksLikeBook) {
    for (const child of Object.values(value)) {
      const offer = firstJsonLdOffer(child, pageUrl);
      if (offer) return offer;
    }
    return undefined;
  }

  const rawOffers = Array.isArray(value.offers) ? value.offers[0] : value.offers;
  const offers = isRecord(rawOffers) ? rawOffers : {};
  const url = absoluteKoboUrl(stringValue(value.url) ?? pageUrl);
  const currency = stringValue(offers.priceCurrency);
  const sourceProductId = productIdFromUrl(url);
  const isbn = stringValue(value.isbn) ?? stringValue(value.sku);
  const title = stringValue(value.name);
  const publisher = stringValue(value.publisher);
  const publicationDate = stringValue(value.datePublished);
  const imageUrl = absoluteKoboUrl(stringValue(value.image));
  const offer: KoboProbeOffer = {
    authors: stringArray(value.author),
    productType: '電子書',
    ...parsePrice(offers.price, currency),
  };

  if (sourceProductId) offer.sourceProductId = sourceProductId;
  if (isbn) offer.isbn = isbn;
  if (title) offer.title = title;
  if (publisher) offer.publisher = publisher;
  if (publicationDate) offer.publicationDate = publicationDate;
  if (value.description) offer.summary = stripTags(String(value.description));
  if (currency) offer.currency = currency;
  if (url) offer.url = url;
  if (imageUrl) offer.imageUrl = imageUrl;

  return offer;
}

function parseJsonLd(html: string, pageUrl: string): KoboProbeOffer[] {
  const offers: KoboProbeOffer[] = [];
  const scripts = html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  );

  for (const match of scripts) {
    try {
      const offer = firstJsonLdOffer(JSON.parse(match[1] ?? 'null') as unknown, pageUrl);
      if (offer?.title) offers.push(offer);
    } catch {
      // The probe reports missing fields; malformed unrelated JSON-LD is not fatal.
    }
  }

  return offers;
}

function testIdText(block: string, testId: string): string | undefined {
  const match = block.match(
    new RegExp(`<[^>]+data-testid=["']${testId}["'][^>]*>([\\s\\S]*?)<\\/[^>]+>`, 'i')
  );
  const value = match?.[1] ? stripTags(match[1]) : undefined;
  return value || undefined;
}

function testIdAttribute(block: string, testId: string, attribute: string): string | undefined {
  const tag = block.match(new RegExp(`<[^>]+data-testid=["']${testId}["'][^>]*>`, 'i'))?.[0];
  return tag?.match(new RegExp(`${attribute}=["']([^"']+)["']`, 'i'))?.[1];
}

function parseSearchCards(html: string): KoboProbeOffer[] {
  const container =
    html.match(/<[^>]+data-testid=["']search-results-items["'][^>]*>([\s\S]*?)<\/ul>/i)?.[1] ??
    html;
  const cards = Array.from(
    container.matchAll(/<li[^>]*role=["']listitem["'][^>]*>([\s\S]*?)<\/li>/gi)
  );

  return cards.flatMap((card) => {
    const block = card[1] ?? '';
    const title = testIdText(block, 'title');
    const rawUrl = testIdAttribute(block, 'title', 'href');
    const url = absoluteKoboUrl(rawUrl);
    if (!title || !url) return [];

    const priceText = testIdText(block, 'price-value');
    const imageUrl = absoluteKoboUrl(testIdAttribute(block, 'cover', 'src'));
    const authorsText = testIdText(block, 'authors')?.replace(/^作者\s*/u, '');
    const sourceProductId = productIdFromUrl(url);
    const offer: KoboProbeOffer = {
      title,
      authors: authorsText ? authorsText.split(/\s*[、,，]\s*/u).filter(Boolean) : [],
      currency: 'TWD',
      url,
      productType: '電子書',
      ...parsePrice(priceText, 'TWD'),
    };

    if (sourceProductId) offer.sourceProductId = sourceProductId;
    if (imageUrl) offer.imageUrl = imageUrl;

    return [offer];
  });
}

export function isKoboChallenge(status: number, html: string): boolean {
  return (
    status === 403 ||
    /cf-mitigated|cf_chl_opt|challenge-platform|<title>\s*Challenged\s*\|\s*Kobo\.com/i.test(html)
  );
}

export function parseKoboProbePage(
  html: string,
  pageUrl: string,
  status = 200
): Pick<KoboProbeResult, 'challenged' | 'pageKind' | 'offers' | 'missingRequiredFields'> {
  const challenged = isKoboChallenge(status, html);
  if (challenged) {
    return { challenged, pageKind: 'challenge', offers: [], missingRequiredFields: [] };
  }

  const jsonLdOffers = parseJsonLd(html, pageUrl);
  const cardOffers = parseSearchCards(html);
  const offers = cardOffers.length > 0 ? cardOffers : jsonLdOffers;
  const pageKind = /\/ebook\//.test(pageUrl)
    ? 'detail'
    : cardOffers.length > 0
      ? 'search'
      : 'unknown';
  const required = ['title', 'authors', 'publisher', 'price', 'currency', 'url', 'imageUrl'];
  const missingRequiredFields = Array.from(
    new Set(
      offers.flatMap((offer) =>
        required.filter((field) => {
          const value = offer[field as keyof KoboProbeOffer];
          return value == null || value === '' || (Array.isArray(value) && value.length === 0);
        })
      )
    )
  );

  return { challenged, pageKind, offers, missingRequiredFields };
}

export async function probeKoboTw(
  query: string,
  fetchImpl: typeof fetch = fetch
): Promise<KoboProbeResult> {
  const requestUrl = buildKoboTwSearchUrl(query);
  const response = await fetchImpl(requestUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'accept-language': 'zh-TW,zh;q=0.9,en;q=0.8',
      'user-agent': KOBO_USER_AGENT,
    },
    redirect: 'follow',
  });
  const html = await response.text();

  return {
    query,
    requestUrl,
    finalUrl: response.url || requestUrl,
    status: response.status,
    ...parseKoboProbePage(html, response.url || requestUrl, response.status),
  };
}
