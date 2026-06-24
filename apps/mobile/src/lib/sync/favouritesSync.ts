import { normalizeIsbn } from '@bookscompare/contracts';

import { loadFavourites, replaceFavourites, type Favourite } from '../favourites';
import { getActiveAccount } from './session';

import type { SupabaseClient } from '@supabase/supabase-js';

const TABLE = 'favourites';

interface FavouriteRow {
  isbn: string;
  title: string;
  added_at: string;
}

function rowToFavourite(row: FavouriteRow): Favourite | null {
  const addedAt = Date.parse(row.added_at);
  if (Number.isNaN(addedAt) || !row.isbn || !row.title) {
    return null;
  }
  return { isbn: row.isbn, title: row.title, addedAt };
}

function favouriteToRow(userId: string, fav: Favourite): FavouriteRow & { user_id: string } {
  return {
    user_id: userId,
    isbn: fav.isbn,
    title: fav.title,
    added_at: new Date(fav.addedAt).toISOString(),
  };
}

/**
 * Merge two favourite lists. De-dupes by ISBN, keeping the most recently added
 * copy. Returns newest first.
 */
export function mergeFavourites(local: Favourite[], remote: Favourite[]): Favourite[] {
  const byIsbn = new Map<string, Favourite>();

  for (const fav of [...local, ...remote]) {
    const existing = byIsbn.get(fav.isbn);
    if (!existing || fav.addedAt >= existing.addedAt) {
      byIsbn.set(fav.isbn, fav);
    }
  }

  return Array.from(byIsbn.values()).sort((a, b) => b.addedAt - a.addedAt);
}

async function pullRemoteFavourites(supabase: SupabaseClient): Promise<Favourite[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('isbn,title,added_at')
    .order('added_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => rowToFavourite(row as FavouriteRow)).filter(isFavourite);
}

function isFavourite(value: Favourite | null): value is Favourite {
  return value !== null;
}

/** Upsert the given favourites for the current user (background, best-effort). */
export async function pushFavourites(
  supabase: SupabaseClient,
  userId: string,
  favourites: Favourite[]
): Promise<void> {
  if (favourites.length === 0) {
    return;
  }
  const { error } = await supabase.from(TABLE).upsert(
    favourites.map((fav) => favouriteToRow(userId, fav)),
    { onConflict: 'user_id,isbn' }
  );
  if (error) {
    throw error;
  }
}

/**
 * Background upsert of the given favourites for the signed-in user. No-op when
 * Supabase is not configured or no user is signed in.
 */
export async function remoteUpsertFavourites(favourites: Favourite[]): Promise<void> {
  const account = await getActiveAccount();
  if (!account) {
    return;
  }
  await pushFavourites(account.supabase, account.userId, favourites);
}

/** Delete a single favourite by ISBN for the signed-in user. */
export async function remoteRemoveFavourite(isbn: string): Promise<void> {
  const account = await getActiveAccount();
  if (!account) {
    return;
  }
  const normalized = normalizeIsbn(isbn);
  if (!normalized) {
    return;
  }
  const { error } = await account.supabase
    .from(TABLE)
    .delete()
    .eq('user_id', account.userId)
    .eq('isbn', normalized);
  if (error) {
    throw error;
  }
}

/** Delete all of the signed-in user's remote favourites (mirrors clearFavourites). */
export async function remoteClearFavourites(): Promise<void> {
  const account = await getActiveAccount();
  if (!account) {
    return;
  }
  const { error } = await account.supabase.from(TABLE).delete().eq('user_id', account.userId);
  if (error) {
    throw error;
  }
}

/**
 * Full reconcile: pull remote, merge with local, persist merged locally, and
 * push the merged set back. Returns the merged list.
 */
export async function syncFavourites(
  supabase: SupabaseClient,
  userId: string
): Promise<Favourite[]> {
  const [local, remote] = await Promise.all([loadFavourites(), pullRemoteFavourites(supabase)]);
  const merged = mergeFavourites(local, remote);
  await replaceFavourites(merged);
  await pushFavourites(supabase, userId, merged);
  return merged;
}
