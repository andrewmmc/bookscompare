import {
  BOOK_SOURCES,
  type ApiErrorResponse,
  type LookupResponse,
  type SourceState,
} from '@bookscompare/contracts';

const disabledSourceMessage = 'This source does not yet have a live provider implementation.';

interface CreateLookupResponseInput {
  isbn: string;
  data: LookupResponse['data'];
  sources: SourceState[];
  liveScraping: boolean;
  message?: string;
}

export function createLookupResponse({
  isbn,
  data,
  sources,
  liveScraping,
  message,
}: CreateLookupResponseInput): LookupResponse {
  return {
    query: { isbn },
    data,
    sources,
    meta: {
      liveScraping,
      requestedAt: new Date().toISOString(),
      ...(message ? { message } : {}),
    },
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
