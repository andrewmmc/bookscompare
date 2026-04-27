type AnalyticsProps = Record<string, string | number | boolean | undefined>;

export const posthogAnalyticsProvider = {
  track(_event: string, _props?: AnalyticsProps): void {
    throw new Error('PostHog is reserved for a later integration step.');
  },
  identify(_userId?: string): void {
    throw new Error('PostHog is reserved for a later integration step.');
  },
};
