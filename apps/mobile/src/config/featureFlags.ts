export const featureFlags = {
  enableTitleSearch: true,
  // Account-based history/favourites sync. Auth UI and sync only activate when
  // this is true AND Supabase env vars are configured (see lib/supabase.ts).
  enableAccounts: true,
} as const;
