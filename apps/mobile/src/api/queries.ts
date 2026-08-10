import { useQuery } from '@tanstack/react-query';

import { lookupIsbn } from './isbn';
import { searchByTitle } from './title';

export function useIsbnLookup(isbn: string) {
  return useQuery({
    queryKey: ['isbn-lookup', isbn],
    queryFn: ({ signal }) => lookupIsbn(isbn, signal),
    enabled: isbn.length > 0,
  });
}

export function useTitleSearch(title: string) {
  return useQuery({
    queryKey: ['title-search', title],
    queryFn: ({ signal }) => searchByTitle(title, signal),
    enabled: title.length > 0,
  });
}
