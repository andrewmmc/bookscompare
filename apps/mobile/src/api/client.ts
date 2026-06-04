import Constants from 'expo-constants';

import type { ApiErrorCode, ApiErrorResponse } from '@bookscompare/contracts';

interface AppExtra {
  apiBaseUrl?: string;
}

const defaultApiBaseUrl = 'https://bookscompare-api.mmc.dev';

function readConfiguredApiBaseUrl(): string | undefined {
  const extra = (Constants.expoConfig?.extra ?? {}) as Partial<AppExtra>;
  return extra.apiBaseUrl || process.env.EXPO_PUBLIC_API_BASE_URL || undefined;
}

function getApiBaseUrl(): string {
  return (readConfiguredApiBaseUrl() ?? defaultApiBaseUrl).replace(/\/$/, '');
}

export class ApiError extends Error {
  status: number;
  body: string | undefined;
  code: ApiErrorCode | undefined;
  responseMessage: string | undefined;

  constructor(status: number, body?: string, code?: ApiErrorCode, responseMessage?: string) {
    super(responseMessage ?? `API request failed with status ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
    this.code = code;
    this.responseMessage = responseMessage;
  }
}

function parseApiErrorBody(
  body: string
): Pick<ApiErrorResponse['error'], 'code' | 'message'> | null {
  try {
    const parsed = JSON.parse(body) as Partial<ApiErrorResponse>;
    const error = parsed.error;

    if (error && typeof error.code === 'string' && typeof error.message === 'string') {
      return error;
    }
  } catch {
    // Non-JSON error bodies are preserved as raw body text on ApiError.
  }

  return null;
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`);

  if (!response.ok) {
    const body = await response.text();
    const apiError = parseApiErrorBody(body);
    throw new ApiError(response.status, body, apiError?.code, apiError?.message);
  }

  return (await response.json()) as T;
}

export { getApiBaseUrl };
