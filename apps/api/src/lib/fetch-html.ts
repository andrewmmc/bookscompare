interface FetchHtmlOptions {
  headers?: HeadersInit;
  notFoundStatus?: number;
  errorLabel?: string;
  timeoutMs?: number;
}

import { fetchWithTimeout } from './fetch-with-timeout';

export async function fetchHtml(
  url: string,
  options: FetchHtmlOptions = {}
): Promise<string | null> {
  let response: Response;

  try {
    response = await fetchWithTimeout(
      url,
      options.headers ? { headers: options.headers } : undefined,
      options.timeoutMs
    );
  } catch (error) {
    if (options.timeoutMs && error instanceof Error && error.name === 'AbortError') {
      throw new Error(
        options.errorLabel
          ? `${options.errorLabel} timed out after ${options.timeoutMs}ms.`
          : `Request timed out after ${options.timeoutMs}ms.`,
        { cause: error }
      );
    }

    throw error;
  }

  if (options.notFoundStatus && response.status === options.notFoundStatus) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      options.errorLabel
        ? `${options.errorLabel} returned ${response.status}.`
        : `Request failed with ${response.status}.`
    );
  }

  return response.text();
}
