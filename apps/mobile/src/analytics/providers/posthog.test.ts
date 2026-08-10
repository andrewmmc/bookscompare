import { createPostHogProvider } from './posthog';

const mockCapture = jest.fn();
const mockIdentify = jest.fn();
const mockRegister = jest.fn();
const mockReset = jest.fn();
const mockOptIn = jest.fn();
const mockOptOut = jest.fn();
const mockPostHog = jest.fn().mockImplementation(() => ({
  capture: mockCapture,
  identify: mockIdentify,
  register: mockRegister,
  reset: mockReset,
  optIn: mockOptIn,
  optOut: mockOptOut,
}));

jest.mock('posthog-react-native', () => ({ PostHog: mockPostHog }));

describe('createPostHogProvider', () => {
  beforeEach(() => {
    mockCapture.mockClear();
    mockIdentify.mockClear();
    mockRegister.mockClear();
    mockReset.mockClear();
    mockOptIn.mockClear();
    mockOptOut.mockClear();
    mockPostHog.mockClear();
  });

  it('initialises PostHog once with the configured host', () => {
    const provider = createPostHogProvider('test-key', 'https://posthog.example.com');

    provider.setEnabled(true);
    provider.init();
    provider.init();

    expect(mockPostHog).toHaveBeenCalledTimes(1);
    expect(mockPostHog).toHaveBeenCalledWith('test-key', {
      host: 'https://posthog.example.com',
      captureAppLifecycleEvents: true,
    });
  });

  it('proxies analytics calls after init', () => {
    const provider = createPostHogProvider('test-key');

    provider.setEnabled(true);
    provider.init();
    provider.track('Search Submitted', { method: 'isbn' });
    provider.register({ appVersion: '1.0.0' });
    provider.identify('user-1');
    provider.identify();

    expect(mockCapture).toHaveBeenCalledWith('Search Submitted', { method: 'isbn' });
    expect(mockRegister).toHaveBeenCalledWith({ appVersion: '1.0.0' });
    expect(mockIdentify).toHaveBeenCalledWith('user-1');
    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  it('ignores analytics calls before init', () => {
    const provider = createPostHogProvider('test-key');

    provider.track('Search Submitted');
    provider.register({ appVersion: '1.0.0' });
    provider.identify('user-1');

    expect(mockCapture).not.toHaveBeenCalled();
    expect(mockRegister).not.toHaveBeenCalled();
    expect(mockIdentify).not.toHaveBeenCalled();
    expect(mockReset).not.toHaveBeenCalled();
  });

  it('does not initialise until the user opts in and opts out an active client', () => {
    const provider = createPostHogProvider('test-key');

    provider.init();
    expect(mockPostHog).not.toHaveBeenCalled();

    provider.setEnabled(true);
    provider.init();
    expect(mockPostHog).toHaveBeenCalledTimes(1);

    provider.setEnabled(false);
    expect(mockOptOut).toHaveBeenCalledTimes(1);
    expect(mockReset).toHaveBeenCalledTimes(1);
  });
});
