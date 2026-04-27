import { noopAnalyticsProvider } from './providers/noop';

type AnalyticsProps = Record<string, string | number | boolean | undefined>;

const provider = noopAnalyticsProvider;

export function track(event: string, props?: AnalyticsProps): void {
  provider.track(event, props);
}

export function identify(userId?: string): void {
  provider.identify(userId);
}
