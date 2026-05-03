import { useQuery } from '@tanstack/react-query';

import { lookupBookByTitle } from './book';
import { lookupIsbn } from './isbn';
import { searchByTitle } from './title';

export type BookDetailParams = { isbn: string } | { title: string; author?: string };

export function useTitleSearch(title: string) {
  return useQuery({
    queryKey: ['title-search', title],
    queryFn: () => searchByTitle(title),
    enabled: title.length > 0,
  });
}

export function useBookDetail(params: BookDetailParams | undefined) {
  const isbn = params && 'isbn' in params ? params.isbn : '';
  const title = params && 'title' in params ? params.title : '';
  const author = params && 'title' in params ? (params.author ?? '') : '';

  return useQuery({
    queryKey: isbn ? ['book-detail', 'isbn', isbn] : ['book-detail', 'title', title, author],
    queryFn: () => {
      if (isbn) {
        return lookupIsbn(isbn);
      }
      return lookupBookByTitle({ title, ...(author ? { author } : {}) });
    },
    enabled: Boolean(isbn || title),
  });
}
