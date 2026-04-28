import Constants from 'expo-constants';

import { noopAnalyticsProvider } from './providers/noop';
import { createPostHogProvider } from './providers/posthog';

import type { AnalyticsProps, AnalyticsProvider } from './types';

interface AnalyticsExtra {
  posthogKey?: string | undefined;
  posthogHost?: string | undefined;
}

function readExtra(): AnalyticsExtra {
  const extra = (Constants.expoConfig?.extra ?? {}) as Partial<AnalyticsExtra>;
  return {
    posthogKey: extra.posthogKey,
    posthogHost: extra.posthogHost,
  };
}

function selectProvider(): AnalyticsProvider {
  const { posthogKey, posthogHost } = readExtra();

  if (posthogKey && posthogKey.length > 0) {
    return createPostHogProvider(posthogKey, posthogHost);
  }

  return noopAnalyticsProvider;
}

const provider = selectProvider();

export function initAnalytics(): void {
  provider.init();
}

export function track(event: string, props?: AnalyticsProps): void {
  provider.track(event, props);
}

export function identify(userId?: string): void {
  provider.identify(userId);
}

export type { AnalyticsProps, AnalyticsProvider } from './types';
