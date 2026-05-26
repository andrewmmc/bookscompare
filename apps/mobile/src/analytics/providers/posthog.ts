import type { AnalyticsProps, AnalyticsProvider } from '../types';

const DEFAULT_HOST = 'https://us.i.posthog.com';

interface PostHogClient {
  capture(event: string, props?: Record<string, unknown>): void;
  register(props: Record<string, unknown>): void;
  identify(userId: string): void;
  reset(): void;
}

interface PostHogConstructor {
  new (
    apiKey: string,
    options: { host: string; captureAppLifecycleEvents?: boolean }
  ): PostHogClient;
}

export function createPostHogProvider(
  apiKey: string,
  host: string = DEFAULT_HOST
): AnalyticsProvider {
  let client: PostHogClient | null = null;
  let initialized = false;

  return {
    init(): void {
      if (initialized) {
        return;
      }
      initialized = true;

      try {
        // Lazy require so jest / non-runtime callers do not pull in the native module.
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const mod = require('posthog-react-native') as { PostHog: PostHogConstructor };
        client = new mod.PostHog(apiKey, { host, captureAppLifecycleEvents: true });
      } catch (error) {
        if (__DEV__) {
          console.warn('[analytics] Failed to initialise PostHog:', error);
        }
        client = null;
      }
    },
    track(event: string, props?: AnalyticsProps): void {
      client?.capture(event, props);
    },
    register(props: AnalyticsProps): void {
      client?.register(props);
    },
    identify(userId?: string): void {
      if (!client) {
        return;
      }

      if (userId) {
        client.identify(userId);
      } else {
        client.reset();
      }
    },
  };
}
