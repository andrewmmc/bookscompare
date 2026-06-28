import { getSupabaseClient } from '../supabase';

import type { SupabaseClient } from '@supabase/supabase-js';

export interface ActiveAccount {
  supabase: SupabaseClient;
  userId: string;
}

/**
 * Resolve the currently signed-in account, or null when Supabase is not
 * configured or no user is signed in. Used by the background write helpers so
 * the React Query mutation hooks stay free of auth wiring.
 */
export async function getActiveAccount(): Promise<ActiveAccount | null> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return null;
  }
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  return userId ? { supabase, userId } : null;
}

/**
 * Run a best-effort background sync task. Resolves regardless of outcome so a
 * failed remote write never breaks the local-first UX. `onError` is invoked
 * with the error for optional (PII-free) analytics.
 */
export function runBackground(task: () => Promise<void>, onError?: (error: unknown) => void): void {
  void task().catch((error) => {
    onError?.(error);
  });
}
