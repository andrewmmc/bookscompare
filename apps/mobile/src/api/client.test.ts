const originalEnvApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

function loadClient(extra?: { apiBaseUrl?: string }, envApiBaseUrl?: string) {
  jest.resetModules();

  if (envApiBaseUrl === undefined) {
    delete process.env.EXPO_PUBLIC_API_BASE_URL;
  } else {
    process.env.EXPO_PUBLIC_API_BASE_URL = envApiBaseUrl;
  }

  jest.doMock('expo-constants', () => ({
    expoConfig: extra ? { extra } : {},
  }));

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const client = require('./client') as typeof import('./client');

  return client;
}

describe('api client configuration', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.dontMock('expo-constants');
    jest.resetModules();
    if (originalEnvApiBaseUrl === undefined) {
      delete process.env.EXPO_PUBLIC_API_BASE_URL;
    } else {
      process.env.EXPO_PUBLIC_API_BASE_URL = originalEnvApiBaseUrl;
    }
  });

  it('prefers Expo config extra over environment variables', () => {
    const { getApiBaseUrl } = loadClient(
      { apiBaseUrl: 'https://configured.example.com/' },
      'https://env.example.com'
    );

    expect(getApiBaseUrl()).toBe('https://configured.example.com');
  });

  it('falls back to the environment variable when Expo config is unavailable', () => {
    const { getApiBaseUrl } = loadClient(undefined, 'https://env.example.com/');

    expect(getApiBaseUrl()).toBe('https://env.example.com');
  });

  it('falls back to the production API domain', () => {
    const { getApiBaseUrl } = loadClient();

    expect(getApiBaseUrl()).toBe('https://bookscompare-api.mmc.dev');
  });

  it('preserves structured API error payloads', async () => {
    const { ApiError, apiGet } = loadClient();
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 400,
      text: async () =>
        JSON.stringify({
          error: {
            code: 'INVALID_QUERY',
            message: 'Provide a non-empty search query via ?q=.',
          },
        }),
    } as Response);

    await expect(apiGet('/search')).rejects.toMatchObject({
      name: 'ApiError',
      status: 400,
      code: 'INVALID_QUERY',
      message: 'Provide a non-empty search query via ?q=.',
      responseMessage: 'Provide a non-empty search query via ?q=.',
    });
    await expect(apiGet('/search')).rejects.toBeInstanceOf(ApiError);
  });

  it('passes an abort signal so requests can time out', async () => {
    const { apiGet } = loadClient();
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    } as Response);

    await apiGet('/health');

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const init = fetchSpy.mock.calls[0]?.[1];
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it('surfaces aborted requests as a timeout ApiError', async () => {
    const { ApiError, apiGet } = loadClient();
    jest.spyOn(global, 'fetch').mockImplementation(() => {
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      return Promise.reject(abortError);
    });

    await expect(apiGet('/health')).rejects.toMatchObject({
      name: 'ApiError',
      status: 0,
      message: 'The request timed out. Please try again.',
    });
    await expect(apiGet('/health')).rejects.toBeInstanceOf(ApiError);
  });

  it('keeps raw body text for non-JSON error responses', async () => {
    const { apiGet } = loadClient();
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'server error',
    } as Response);

    await expect(apiGet('/isbn/9781402894626')).rejects.toMatchObject({
      status: 500,
      body: 'server error',
      code: undefined,
      responseMessage: undefined,
      message: 'API request failed with status 500',
    });
  });
});
