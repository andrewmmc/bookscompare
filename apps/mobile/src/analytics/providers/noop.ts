type AnalyticsProps = Record<string, string | number | boolean | undefined>;

export const noopAnalyticsProvider = {
  track(_event: string, _props?: AnalyticsProps): void {
    // Intentionally blank while analytics is disabled in v2.
  },
  identify(_userId?: string): void {
    // Intentionally blank while analytics is disabled in v2.
  },
};
