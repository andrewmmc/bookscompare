import {
  BOOK_SOURCES,
  type ApiErrorResponse,
  type BookDetail,
  type BookDetailResponse,
  type ResponseMeta,
  type SearchResponse,
  type SourceState,
} from '@bookscompare/contracts';

const disabledSourceMessage = 'This source does not yet have a live provider implementation.';

interface BuildMetaInput {
  liveScraping: boolean;
  message?: string;
  requestedAt?: string;
}

export function buildMeta({ liveScraping, message, requestedAt }: BuildMetaInput): ResponseMeta {
  return {
    liveScraping,
    requestedAt: requestedAt ?? new Date().toISOString(),
    ...(message ? { message } : {}),
  };
}

interface CreateSearchResponseInput {
  query: SearchResponse['query'];
  books: BookDetail[];
  sources: SourceState[];
  liveScraping: boolean;
  message?: string;
}

export function createSearchResponse({
  query,
  books,
  sources,
  liveScraping,
  message,
}: CreateSearchResponseInput): SearchResponse {
  return {
    query,
    books,
    sources,
    meta: buildMeta({ liveScraping, ...(message ? { message } : {}) }),
  };
}

interface CreateBookDetailResponseInput {
  query: BookDetailResponse['query'];
  book: BookDetail | null;
  sources: SourceState[];
  liveScraping: boolean;
  message?: string;
}

export function createBookDetailResponse({
  query,
  book,
  sources,
  liveScraping,
  message,
}: CreateBookDetailResponseInput): BookDetailResponse {
  return {
    query,
    book,
    sources,
    meta: buildMeta({ liveScraping, ...(message ? { message } : {}) }),
  };
}

export function createDisabledSourceState(sourceId: SourceState['id']): SourceState {
  const source = BOOK_SOURCES.find((item) => item.id === sourceId);

  if (!source) {
    throw new Error(`Unknown source id: ${sourceId}`);
  }

  return {
    id: source.id,
    name: source.name,
    status: 'disabled',
    message: disabledSourceMessage,
  };
}

export function createErrorResponse(
  code: ApiErrorResponse['error']['code'],
  message: string
): ApiErrorResponse {
  return {
    error: {
      code,
      message,
    },
  };
}
