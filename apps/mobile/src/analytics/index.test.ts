const mockInit = jest.fn();
const mockTrack = jest.fn();
const mockRegister = jest.fn();
const mockIdentify = jest.fn();
const mockCreatePostHogProvider = jest.fn((_apiKey: string, _host?: string) => ({
  init: mockInit,
  track: mockTrack,
  register: mockRegister,
  identify: mockIdentify,
}));
const mockNoopInit = jest.fn();
const mockNoopTrack = jest.fn();
const mockNoopRegister = jest.fn();
const mockNoopIdentify = jest.fn();

function loadAnalytics(extra?: { posthogKey?: string; posthogHost?: string }) {
  jest.resetModules();
  jest.doMock('expo-constants', () => ({
    expoConfig: extra ? { extra } : {},
  }));
  jest.doMock('./providers/posthog', () => ({
    createPostHogProvider: (apiKey: string, host?: string) =>
      mockCreatePostHogProvider(apiKey, host),
  }));
  jest.doMock('./providers/noop', () => ({
    noopAnalyticsProvider: {
      init: mockNoopInit,
      track: mockNoopTrack,
      register: mockNoopRegister,
      identify: mockNoopIdentify,
    },
  }));

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('./index') as typeof import('./index');
}

describe('analytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.dontMock('expo-constants');
    jest.dontMock('./providers/posthog');
    jest.dontMock('./providers/noop');
    jest.resetModules();
  });

  it('uses the noop provider when no PostHog key is configured', () => {
    const analytics = loadAnalytics();

    analytics.initAnalytics();
    analytics.track('search');
    analytics.registerAnalyticsProperties({ locale: 'zh-TW' });
    analytics.identify('user-1');

    expect(mockCreatePostHogProvider).not.toHaveBeenCalled();
    expect(mockNoopInit).toHaveBeenCalled();
    expect(mockNoopTrack).toHaveBeenCalledWith('search', undefined);
    expect(mockNoopRegister).toHaveBeenCalledWith({ locale: 'zh-TW' });
    expect(mockNoopIdentify).toHaveBeenCalledWith('user-1');
  });

  it('uses PostHog when a key is configured and forwards calls', () => {
    const analytics = loadAnalytics({
      posthogKey: 'ph_test_key',
      posthogHost: 'https://posthog.example.com',
    });

    analytics.initAnalytics();
    analytics.track('search_result_loaded', { resultCount: 2 });
    analytics.registerAnalyticsProperties({ locale: 'en' });
    analytics.identify();

    expect(mockCreatePostHogProvider).toHaveBeenCalledWith(
      'ph_test_key',
      'https://posthog.example.com'
    );
    expect(mockInit).toHaveBeenCalled();
    expect(mockTrack).toHaveBeenCalledWith('search_result_loaded', { resultCount: 2 });
    expect(mockRegister).toHaveBeenCalledWith({ locale: 'en' });
    expect(mockIdentify).toHaveBeenCalledWith(undefined);
  });
});
