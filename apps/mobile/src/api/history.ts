import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  addHistoryEntry,
  clearHistory,
  loadHistory,
  removeHistoryEntry,
  restoreHistoryEntry,
  type HistoryEntry,
  type HistoryInput,
} from '../lib/history';
import { syncHistoryToIcloud } from '../lib/icloudSync';

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
      void syncHistoryToIcloud(next).then((synced) => {
        if (synced) {
          queryClient.setQueryData<HistoryEntry[]>(HISTORY_QUERY_KEY, synced);
        }
      });
    },
  });
}

export function useRemoveHistoryEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entry: HistoryEntry) => removeHistoryEntry(entry),
    onSuccess: (next) => {
      queryClient.setQueryData<HistoryEntry[]>(HISTORY_QUERY_KEY, next);
      void syncHistoryToIcloud(next, { mergeRemote: false });
    },
  });
}

export function useRestoreHistoryEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entry: HistoryEntry) => restoreHistoryEntry(entry),
    onSuccess: (next) => {
      queryClient.setQueryData<HistoryEntry[]>(HISTORY_QUERY_KEY, next);
      void syncHistoryToIcloud(next, { mergeRemote: false });
    },
  });
}

export function useClearHistory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => clearHistory(),
    onSuccess: (next) => {
      queryClient.setQueryData<HistoryEntry[]>(HISTORY_QUERY_KEY, next);
      void syncHistoryToIcloud(next, { mergeRemote: false });
    },
  });
}
