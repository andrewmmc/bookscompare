import AsyncStorage from '@react-native-async-storage/async-storage';

import { normalizeIsbn } from './isbn';

export const FAVOURITES_STORAGE_KEY = 'bookscompare:favourites:v1';

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
    typeof record.addedAt === 'number'
  );
}

export async function loadFavourites(): Promise<Favourite[]> {
  try {
    const raw = await AsyncStorage.getItem(FAVOURITES_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isFavourite).sort((a, b) => b.addedAt - a.addedAt);
  } catch {
    return [];
  }
}

async function saveFavourites(list: Favourite[]): Promise<void> {
  await AsyncStorage.setItem(FAVOURITES_STORAGE_KEY, JSON.stringify(list));
}

export async function addFavourite(input: FavouriteInput): Promise<Favourite[]> {
  const isbn = normalizeIsbn(input.isbn);
  const title = input.title.trim();

  if (!isbn || !title) {
    return loadFavourites();
  }

  const current = await loadFavourites();
  const withoutExisting = current.filter((item) => item.isbn !== isbn);
  const next: Favourite[] = [{ isbn, title, addedAt: Date.now() }, ...withoutExisting];
  await saveFavourites(next);
  return next;
}

export async function removeFavourite(isbn: string): Promise<Favourite[]> {
  const normalized = normalizeIsbn(isbn);
  const current = await loadFavourites();
  const next = current.filter((item) => item.isbn !== normalized);
  await saveFavourites(next);
  return next;
}
