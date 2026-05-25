import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  addFavourite,
  clearFavourites,
  loadFavourites,
  removeFavourite,
  type Favourite,
} from '../lib/favourites';
import { normalizeIsbn } from '../lib/isbn';

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
    },
  });
}

export function useRemoveFavourite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (isbn: string) => removeFavourite(isbn),
    onSuccess: (next) => {
      queryClient.setQueryData<Favourite[]>(FAVOURITES_QUERY_KEY, next);
    },
  });
}

export function useClearFavourites() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => clearFavourites(),
    onSuccess: (next) => {
      queryClient.setQueryData<Favourite[]>(FAVOURITES_QUERY_KEY, next);
    },
  });
}
