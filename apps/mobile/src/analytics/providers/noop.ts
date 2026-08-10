import type { AnalyticsProps, AnalyticsProvider } from '../types';

export const noopAnalyticsProvider: AnalyticsProvider = {
  setEnabled(_enabled: boolean): void {
    // No-op
  },
  init(): void {
    // No-op: analytics is disabled when no provider key is configured.
  },
  track(_event: string, _props?: AnalyticsProps): void {
    // No-op
  },
  register(_props: AnalyticsProps): void {
    // No-op
  },
  identify(_userId?: string): void {
    // No-op
  },
};
