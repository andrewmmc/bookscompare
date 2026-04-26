import { BOOK_SOURCES } from '@bookscompare/contracts';

import { booksComTwProvider } from './books-com-tw';
import { citeProvider } from './cite';
import { esliteProvider } from './eslite';
import { kingstoneProvider } from './kingstone';

import type { BookProvider } from './types';

const providerById = new Map<BookProvider['id'], BookProvider>([
  [booksComTwProvider.id, booksComTwProvider],
  [citeProvider.id, citeProvider],
  [esliteProvider.id, esliteProvider],
  [kingstoneProvider.id, kingstoneProvider],
]);

export const providers = BOOK_SOURCES.map((source) => {
  const provider = providerById.get(source.id);

  return (
    provider ?? {
      id: source.id,
      name: source.name,
      enabled: false,
    }
  );
}) satisfies Array<Pick<BookProvider, 'id' | 'name' | 'enabled'> | BookProvider>;
