import { normalizeIsbn } from '@bookscompare/contracts';

import { loadJsonValue, saveJsonValue } from './jsonStorage';

export const FAVOURITES_STORAGE_KEY = 'bookscompare:favourites:v1';
export const FAVOURITES_UPDATED_AT_STORAGE_KEY = 'bookscompare:favourites-updated-at:v1';

let favouritesMutationQueue: Promise<void> = Promise.resolve();

function serializeFavouritesMutation<T>(mutation: () => Promise<T>): Promise<T> {
  const result = favouritesMutationQueue.then(mutation, mutation);
  favouritesMutationQueue = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}

export interface Favourite {
  isbn: string;
  title: string;
  addedAt: number;
}

interface FavouriteInput {
  isbn: string;
  title: string;
}

function isFavourite(value: unknown): value is Favourite {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record.isbn === 'string' &&
    typeof record.title === 'string' &&
    typeof record.addedAt === 'number' &&
    Number.isFinite(record.addedAt)
  );
}

export function parseFavourites(value: unknown): Favourite[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isFavourite).sort((a, b) => b.addedAt - a.addedAt);
}

export async function loadFavourites(): Promise<Favourite[]> {
  return loadJsonValue(FAVOURITES_STORAGE_KEY, [], parseFavourites);
}

async function saveFavourites(list: Favourite[], updatedAt = Date.now()): Promise<void> {
  await Promise.all([
    saveJsonValue(FAVOURITES_STORAGE_KEY, list),
    saveJsonValue(FAVOURITES_UPDATED_AT_STORAGE_KEY, updatedAt),
  ]);
}

export async function loadFavouritesUpdatedAt(): Promise<number> {
  return loadJsonValue(FAVOURITES_UPDATED_AT_STORAGE_KEY, 0, (value) =>
    typeof value === 'number' && Number.isFinite(value) ? value : 0
  );
}

export function replaceFavourites(list: Favourite[], updatedAt = Date.now()): Promise<Favourite[]> {
  return serializeFavouritesMutation(async () => {
    await saveFavourites(list, updatedAt);
    return list;
  });
}

export function addFavourite(input: FavouriteInput): Promise<Favourite[]> {
  const isbn = normalizeIsbn(input.isbn);
  const title = input.title.trim();

  if (!isbn || !title) {
    return loadFavourites();
  }

  return serializeFavouritesMutation(async () => {
    const current = await loadFavourites();
    const withoutExisting = current.filter((item) => item.isbn !== isbn);
    const next: Favourite[] = [{ isbn, title, addedAt: Date.now() }, ...withoutExisting];
    await saveFavourites(next);
    return next;
  });
}

export function removeFavourite(isbn: string): Promise<Favourite[]> {
  return serializeFavouritesMutation(async () => {
    const normalized = normalizeIsbn(isbn);
    const current = await loadFavourites();
    const next = current.filter((item) => item.isbn !== normalized);
    await saveFavourites(next);
    return next;
  });
}

export function restoreFavourite(favourite: Favourite): Promise<Favourite[]> {
  return serializeFavouritesMutation(async () => {
    const current = await loadFavourites();
    const next = parseFavourites([
      favourite,
      ...current.filter((item) => item.isbn !== favourite.isbn),
    ]);
    await saveFavourites(next);
    return next;
  });
}

export function clearFavourites(): Promise<Favourite[]> {
  return serializeFavouritesMutation(async () => {
    await saveFavourites([]);
    return [];
  });
}
