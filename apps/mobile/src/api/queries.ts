import { useQuery } from '@tanstack/react-query';

import { lookupIsbn } from './isbn';
import { searchByTitle } from './title';

export function useIsbnLookup(isbn: string) {
  return useQuery({
    queryKey: ['isbn-lookup', isbn],
    queryFn: () => lookupIsbn(isbn),
    enabled: isbn.length > 0,
  });
}

export function useTitleSearch(title: string) {
  return useQuery({
    queryKey: ['title-search', title],
    queryFn: () => searchByTitle(title),
    enabled: title.length > 0,
  });
}
