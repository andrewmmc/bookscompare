import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';

import { useAuth } from './AuthProvider';

import { identify, track } from '../analytics';
import { FAVOURITES_QUERY_KEY } from '../api/favourites';
import { HISTORY_QUERY_KEY } from '../api/history';
import { getSupabaseClient } from '../lib/supabase';
import { syncFavourites } from '../lib/sync/favouritesSync';
import { syncHistory } from '../lib/sync/historySync';

export interface AccountSyncValue {
  /** True while a pull/merge/push reconcile is in flight. */
  syncing: boolean;
  /** Epoch ms of the last successful sync, or null. */
  lastSyncedAt: number | null;
  /** Manually trigger a full reconcile (no-op when signed out). */
  syncNow: () => Promise<void>;
}

/** Skip a foreground reconcile if one succeeded within this window. */
const FOREGROUND_SYNC_MIN_INTERVAL_MS = 60_000;

const AccountSyncContext = createContext<AccountSyncValue>({
  syncing: false,
  lastSyncedAt: null,
  syncNow: async () => {},
});

export function AccountSyncProvider({ children }: { children: ReactNode }) {
  const { status, user } = useAuth();
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  // Guard against overlapping reconciles (login + app-focus firing together).
  const inFlight = useRef(false);
  // Mirror of lastSyncedAt readable inside the throttled foreground callback
  // without making syncNow depend on (and re-create on) every successful sync.
  const lastSyncedAtRef = useRef<number | null>(null);

  const syncNow = useCallback(
    async (options?: { minIntervalMs?: number }) => {
      const supabase = getSupabaseClient();
      const userId = user?.id;
      if (!supabase || !userId || inFlight.current) {
        return;
      }

      const minIntervalMs = options?.minIntervalMs ?? 0;
      const last = lastSyncedAtRef.current;
      if (minIntervalMs > 0 && last !== null && Date.now() - last < minIntervalMs) {
        return;
      }

      inFlight.current = true;
      setSyncing(true);
      try {
        await syncHistory(supabase, userId);
        await syncFavourites(supabase, userId);
        await queryClient.invalidateQueries({ queryKey: HISTORY_QUERY_KEY });
        await queryClient.invalidateQueries({ queryKey: FAVOURITES_QUERY_KEY });
        const now = Date.now();
        lastSyncedAtRef.current = now;
        setLastSyncedAt(now);
        track('account_sync_success');
      } catch {
        track('account_sync_error', { op: 'reconcile' });
      } finally {
        inFlight.current = false;
        setSyncing(false);
      }
    },
    [queryClient, user?.id]
  );

  // Sync once per signed-in user (also runs the initial login reconcile).
  // Deferred so the reconcile's setState does not run synchronously in the effect.
  useEffect(() => {
    if (status !== 'signedIn' || !user?.id) {
      return;
    }
    identify(user.id);
    const timer = setTimeout(() => void syncNow(), 0);
    return () => clearTimeout(timer);
  }, [status, user?.id, syncNow]);

  // Re-pull on app foreground so a change made on another device shows up.
  useEffect(() => {
    if (status !== 'signedIn') {
      return;
    }
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        // Throttle: avoid a full pull/merge/push on every quick app-switch.
        void syncNow({ minIntervalMs: FOREGROUND_SYNC_MIN_INTERVAL_MS });
      }
    });
    return () => subscription.remove();
  }, [status, syncNow]);

  const value = useMemo<AccountSyncValue>(
    () => ({ syncing, lastSyncedAt, syncNow }),
    [syncing, lastSyncedAt, syncNow]
  );

  return <AccountSyncContext.Provider value={value}>{children}</AccountSyncContext.Provider>;
}

export function useAccountSync(): AccountSyncValue {
  return useContext(AccountSyncContext);
}
