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

export type SourceStatus = 'disabled' | 'ready' | 'error';

export const API_ERROR_CODES = [
  'INVALID_ISBN',
  'INVALID_QUERY',
  'METHOD_NOT_ALLOWED',
  'NOT_FOUND',
  'RATE_LIMITED',
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
