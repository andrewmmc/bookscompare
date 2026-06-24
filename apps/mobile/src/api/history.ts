import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { track } from '../analytics';
import {
  addHistoryEntry,
  clearHistory,
  loadHistory,
  type HistoryEntry,
  type HistoryInput,
} from '../lib/history';
import { remoteClearHistory, remoteUpsertHistory } from '../lib/sync/historySync';
import { runBackground } from '../lib/sync/session';

export const HISTORY_QUERY_KEY = ['history'] as const;

export function useHistory() {
  return useQuery<HistoryEntry[]>({
    queryKey: HISTORY_QUERY_KEY,
    queryFn: loadHistory,
    staleTime: Infinity,
  });
}

export function useAddHistoryEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: HistoryInput) => addHistoryEntry(input),
    onSuccess: (next) => {
      queryClient.setQueryData<HistoryEntry[]>(HISTORY_QUERY_KEY, next);
      runBackground(
        () => remoteUpsertHistory(next),
        () => track('account_sync_error', { op: 'history_upsert' })
      );
    },
  });
}

export function useClearHistory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => clearHistory(),
    onSuccess: (next) => {
      queryClient.setQueryData<HistoryEntry[]>(HISTORY_QUERY_KEY, next);
      runBackground(
        () => remoteClearHistory(),
        () => track('account_sync_error', { op: 'history_clear' })
      );
    },
  });
}
