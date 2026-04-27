import { useQuery } from '@tanstack/react-query';

import { lookupIsbn } from './isbn';

export function useIsbnLookup(isbn: string) {
  return useQuery({
    queryKey: ['isbn-lookup', isbn],
    queryFn: () => lookupIsbn(isbn),
    enabled: isbn.length > 0,
  });
}
