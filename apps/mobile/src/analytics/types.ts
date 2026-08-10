export type AnalyticsProps = Record<string, string | number | boolean | undefined>;

export interface AnalyticsProvider {
  setEnabled(enabled: boolean): void;
  init(): void;
  track(event: string, props?: AnalyticsProps): void;
  register(props: AnalyticsProps): void;
  identify(userId?: string): void;
}
