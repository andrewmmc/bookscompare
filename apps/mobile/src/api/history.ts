import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  addHistoryEntry,
  clearHistory,
  loadHistory,
  type HistoryEntry,
  type HistoryInput,
} from '../lib/history';

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
    },
  });
}

export function useClearHistory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => clearHistory(),
    onSuccess: (next) => {
      queryClient.setQueryData<HistoryEntry[]>(HISTORY_QUERY_KEY, next);
    },
  });
}
