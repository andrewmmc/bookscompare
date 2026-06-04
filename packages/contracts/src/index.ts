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

export type SourceStatus = 'disabled' | 'ready' | 'error';

export const API_ERROR_CODES = [
  'INVALID_ISBN',
  'INVALID_QUERY',
  'METHOD_NOT_ALLOWED',
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
