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
});
