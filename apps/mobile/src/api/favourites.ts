import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { track } from '../analytics';
import {
  addFavourite,
  clearFavourites,
  loadFavourites,
  removeFavourite,
  type Favourite,
} from '../lib/favourites';
import {
  remoteClearFavourites,
  remoteRemoveFavourite,
  remoteUpsertFavourites,
} from '../lib/sync/favouritesSync';
import { runBackground } from '../lib/sync/session';

import { normalizeIsbn } from '@bookscompare/contracts';

export const FAVOURITES_QUERY_KEY = ['favourites'] as const;

export function useFavourites() {
  return useQuery<Favourite[]>({
    queryKey: FAVOURITES_QUERY_KEY,
    queryFn: loadFavourites,
    staleTime: Infinity,
  });
}

export function useIsFavourite(isbn: string): boolean {
  const { data } = useFavourites();
  if (!isbn || !data) {
    return false;
  }

  const normalized = normalizeIsbn(isbn);
  return data.some((item) => item.isbn === normalized);
}

export function useAddFavourite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { isbn: string; title: string }) => addFavourite(input),
    onSuccess: (next) => {
      queryClient.setQueryData<Favourite[]>(FAVOURITES_QUERY_KEY, next);
      runBackground(
        () => remoteUpsertFavourites(next),
        () => track('account_sync_error', { op: 'favourite_upsert' })
      );
    },
  });
}

export function useRemoveFavourite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (isbn: string) => removeFavourite(isbn),
    onSuccess: (next, isbn) => {
      queryClient.setQueryData<Favourite[]>(FAVOURITES_QUERY_KEY, next);
      runBackground(
        () => remoteRemoveFavourite(isbn),
        () => track('account_sync_error', { op: 'favourite_remove' })
      );
    },
  });
}

export function useClearFavourites() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => clearFavourites(),
    onSuccess: (next) => {
      queryClient.setQueryData<Favourite[]>(FAVOURITES_QUERY_KEY, next);
      runBackground(
        () => remoteClearFavourites(),
        () => track('account_sync_error', { op: 'favourite_clear' })
      );
    },
  });
}
