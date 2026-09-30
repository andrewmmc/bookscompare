import type { ApiErrorResponse, BookDetailResponse, SearchResponse } from '@bookscompare/contracts';

export type JsonResponsePayload =
  SearchResponse | BookDetailResponse | ApiErrorResponse | Record<string, string | boolean>;

export function jsonResponse(
  payload: JsonResponsePayload,
  status = 200,
  cacheControl = 'no-store',
  extraHeaders?: HeadersInit
): Response {
  const headers = new Headers(extraHeaders);
  headers.set('cache-control', cacheControl);
  headers.set('content-type', 'application/json; charset=utf-8');

  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers,
  });
}

export function withoutBody(response: Response): Response {
  return new Response(null, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}
