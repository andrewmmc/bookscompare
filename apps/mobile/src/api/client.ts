import Constants from 'expo-constants';

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

  constructor(status: number, body?: string) {
    super(`API request failed with status ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`);

  if (!response.ok) {
    throw new ApiError(response.status, await response.text());
  }

  return (await response.json()) as T;
}

export { getApiBaseUrl };
