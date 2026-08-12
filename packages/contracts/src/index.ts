export const BOOK_SOURCES = [
  {
    id: 'books-com-tw',
    name: '博客來',
  },
  {
    id: 'kingstone',
    name: '金石堂',
  },
  {
    id: 'cite',
    name: '城邦讀書花園',
  },
  {
    id: 'eslite',
    name: '誠品線上',
  },
] as const;

export type BookSourceId = (typeof BOOK_SOURCES)[number]['id'];

export type Currency = 'TWD';

export function normalizeIsbn(input: string): string {
  return input
    .trim()
    .replace(/[\s-]+/g, '')
    .toUpperCase();
}

function isValidIsbn10(isbn: string): boolean {
  if (!/^\d{9}[\dX]$/.test(isbn)) {
    return false;
  }

  let sum = 0;
  for (let i = 0; i < 9; i += 1) {
    sum += (10 - i) * Number(isbn[i]);
  }
  const checkChar = isbn[9];
  sum += checkChar === 'X' ? 10 : Number(checkChar);

  return sum % 11 === 0;
}

function isValidIsbn13(isbn: string): boolean {
  if (!/^\d{13}$/.test(isbn)) {
    return false;
  }

  let sum = 0;
  for (let i = 0; i < 12; i += 1) {
    sum += (i % 2 === 0 ? 1 : 3) * Number(isbn[i]);
  }
  const checkDigit = (10 - (sum % 10)) % 10;

  return checkDigit === Number(isbn[12]);
}

export function isValidIsbn(input: string): boolean {
  const isbn = normalizeIsbn(input);

  return isValidIsbn13(isbn) || isValidIsbn10(isbn);
}

/** Return a valid ISBN in its canonical ISBN-13 representation. */
export function canonicalizeIsbn(input: string): string | null {
  const isbn = normalizeIsbn(input);

  if (isValidIsbn13(isbn)) {
    return isbn;
  }

  if (!isValidIsbn10(isbn)) {
    return null;
  }

  const firstTwelveDigits = `978${isbn.slice(0, 9)}`;
  let sum = 0;
  for (let index = 0; index < firstTwelveDigits.length; index += 1) {
    sum += (index % 2 === 0 ? 1 : 3) * Number(firstTwelveDigits[index]);
  }

  return `${firstTwelveDigits}${(10 - (sum % 10)) % 10}`;
}

export type SourceStatus = 'disabled' | 'ready' | 'error';

export const API_ERROR_CODES = [
  'INVALID_ISBN',
  'INVALID_QUERY',
  'METHOD_NOT_ALLOWED',
  'RATE_LIMITED',
  'NOT_FOUND',
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

export interface BookOffer {
  sourceId: BookSourceId;
  sourceName: string;
  sourceProductId: string;
  isbn?: string;
  title: string;
  productType: string;
  authors: string[];
  publisher: string;
  publicationDate?: string;
  summary: string;
  price: number;
  currency: Currency;
  priceText: string;
  discountRate?: number;
  url: string;
  imageUrl: string;
  previewUrl?: string;
  badges: string[];
}

export interface SourceState {
  id: BookSourceId;
  name: string;
  status: SourceStatus;
  message?: string;
}

/** Fields shared by book list summaries and full detail records. */
export interface BookCore {
  id: string;
  isbn?: string;
  title: string;
  authors: string[];
  publisher?: string;
  publicationDate?: string;
  imageUrl: string;
}

export interface BookSummary extends BookCore {
  lowestPrice?: number;
  currency: Currency;
  offerCount: number;
}

export interface BookDetail extends BookCore {
  summary: string;
  offers: BookOffer[];
}

export interface ResponseMeta {
  liveScraping: boolean;
  requestedAt: string;
  message?: string;
}

export interface SearchResponse {
  query: { title: string };
  books: BookDetail[];
  sources: SourceState[];
  meta: ResponseMeta;
}

export interface BookDetailResponse {
  query: { isbn: string } | { title: string; author?: string };
  book: BookDetail | null;
  sources: SourceState[];
  meta: ResponseMeta;
}

export interface ApiErrorResponse {
  error: {
    code: ApiErrorCode;
    message: string;
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function hasOptionalString(record: Record<string, unknown>, key: string): boolean {
  return record[key] === undefined || typeof record[key] === 'string';
}

function hasOptionalFiniteNumber(record: Record<string, unknown>, key: string): boolean {
  return (
    record[key] === undefined || (typeof record[key] === 'number' && Number.isFinite(record[key]))
  );
}

function isBookSourceId(value: unknown): value is BookSourceId {
  return BOOK_SOURCES.some((source) => source.id === value);
}

function isBookOffer(value: unknown): value is BookOffer {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isBookSourceId(value.sourceId) &&
    typeof value.sourceName === 'string' &&
    typeof value.sourceProductId === 'string' &&
    hasOptionalString(value, 'isbn') &&
    typeof value.title === 'string' &&
    typeof value.productType === 'string' &&
    isStringArray(value.authors) &&
    typeof value.publisher === 'string' &&
    hasOptionalString(value, 'publicationDate') &&
    typeof value.summary === 'string' &&
    typeof value.price === 'number' &&
    Number.isFinite(value.price) &&
    value.currency === 'TWD' &&
    typeof value.priceText === 'string' &&
    hasOptionalFiniteNumber(value, 'discountRate') &&
    typeof value.url === 'string' &&
    typeof value.imageUrl === 'string' &&
    hasOptionalString(value, 'previewUrl') &&
    isStringArray(value.badges)
  );
}

function isBookDetail(value: unknown): value is BookDetail {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    hasOptionalString(value, 'isbn') &&
    typeof value.title === 'string' &&
    isStringArray(value.authors) &&
    hasOptionalString(value, 'publisher') &&
    hasOptionalString(value, 'publicationDate') &&
    typeof value.imageUrl === 'string' &&
    typeof value.summary === 'string' &&
    Array.isArray(value.offers) &&
    value.offers.every(isBookOffer)
  );
}

function isSourceState(value: unknown): value is SourceState {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isBookSourceId(value.id) &&
    typeof value.name === 'string' &&
    (value.status === 'disabled' || value.status === 'ready' || value.status === 'error') &&
    hasOptionalString(value, 'message')
  );
}

function isResponseMeta(value: unknown): value is ResponseMeta {
  return (
    isRecord(value) &&
    typeof value.liveScraping === 'boolean' &&
    typeof value.requestedAt === 'string' &&
    hasOptionalString(value, 'message')
  );
}

export function isSearchResponse(value: unknown): value is SearchResponse {
  if (!isRecord(value) || !isRecord(value.query)) {
    return false;
  }

  return (
    typeof value.query.title === 'string' &&
    Array.isArray(value.books) &&
    value.books.every(isBookDetail) &&
    Array.isArray(value.sources) &&
    value.sources.every(isSourceState) &&
    isResponseMeta(value.meta)
  );
}

export function isBookDetailResponse(value: unknown): value is BookDetailResponse {
  if (!isRecord(value) || !isRecord(value.query)) {
    return false;
  }

  const hasValidQuery =
    typeof value.query.isbn === 'string' ||
    (typeof value.query.title === 'string' && hasOptionalString(value.query, 'author'));

  return (
    hasValidQuery &&
    (value.book === null || isBookDetail(value.book)) &&
    Array.isArray(value.sources) &&
    value.sources.every(isSourceState) &&
    isResponseMeta(value.meta)
  );
}
