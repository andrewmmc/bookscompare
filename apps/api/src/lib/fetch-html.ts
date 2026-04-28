interface FetchHtmlOptions {
  headers?: HeadersInit;
  notFoundStatus?: number;
  errorLabel?: string;
  timeoutMs?: number;
  retries?: number;
  providerId?: string;
}

import { fetchWithTimeout } from './fetch-with-timeout';
import { logFetchAttempt } from './logger';

const USER_AGENT_POOL = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
] as const;

function pickUserAgent(): string {
  const index = Math.floor(Math.random() * USER_AGENT_POOL.length);

  return USER_AGENT_POOL[index] ?? USER_AGENT_POOL[0];
}

function shouldRetryStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

function applyDefaultHeaders(headers?: HeadersInit): Headers {
  const merged = new Headers(headers);

  if (!merged.has('user-agent')) {
    merged.set('user-agent', pickUserAgent());
  }

  return merged;
}

async function backoff(attempt: number): Promise<void> {
  const baseMs = 100 * 2 ** attempt;
  const jitter = Math.floor(Math.random() * 50);

  await new Promise((resolve) => setTimeout(resolve, baseMs + jitter));
}

export async function fetchHtml(
  url: string,
  options: FetchHtmlOptions = {}
): Promise<string | null> {
  const maxAttempts = Math.max(1, (options.retries ?? 1) + 1);
  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const headers = applyDefaultHeaders(options.headers);
    const startedAt = Date.now();
    let response: Response;

    try {
      response = await fetchWithTimeout(url, { headers }, options.timeoutMs);
    } catch (error) {
      const durationMs = Date.now() - startedAt;
      lastError = error;

      if (options.timeoutMs && error instanceof Error && error.name === 'AbortError') {
        lastError = new Error(
          options.errorLabel
            ? `${options.errorLabel} timed out after ${options.timeoutMs}ms.`
            : `Request timed out after ${options.timeoutMs}ms.`,
          { cause: error }
        );
      }

      logFetchAttempt({
        providerId: options.providerId,
        url,
        attempt: attempt + 1,
        durationMs,
        error: lastError instanceof Error ? lastError.message : String(lastError),
      });

      if (attempt + 1 < maxAttempts) {
        await backoff(attempt);
        continue;
      }

      throw lastError;
    }

    const durationMs = Date.now() - startedAt;
    logFetchAttempt({
      providerId: options.providerId,
      url,
      attempt: attempt + 1,
      status: response.status,
      durationMs,
    });

    if (options.notFoundStatus && response.status === options.notFoundStatus) {
      return null;
    }

    if (!response.ok) {
      lastError = new Error(
        options.errorLabel
          ? `${options.errorLabel} returned ${response.status}.`
          : `Request failed with ${response.status}.`
      );

      if (shouldRetryStatus(response.status) && attempt + 1 < maxAttempts) {
        await backoff(attempt);
        continue;
      }

      throw lastError;
    }

    return response.text();
  }

  // Should be unreachable; included for type-safety.
  throw lastError ?? new Error('fetchHtml exhausted retries without a response.');
}
