import { BOOK_SOURCES, type BookSourceId } from '@bookscompare/contracts';

export function sourceMeta(sourceId: BookSourceId): { id: BookSourceId; name: string } {
  const source = BOOK_SOURCES.find((item) => item.id === sourceId);

  if (!source) {
    throw new Error(`Unknown source id: ${sourceId}`);
  }

  return source;
}
