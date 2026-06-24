import {
  HISTORY_MAX_ENTRIES,
  historyEntryKey,
  loadHistory,
  replaceHistory,
  type HistoryEntry,
} from '../history';
import { getActiveAccount } from './session';

import type { SupabaseClient } from '@supabase/supabase-js';

const TABLE = 'history_entries';

interface HistoryRow {
  dedupe_key: string;
  type: 'isbn' | 'title';
  isbn: string | null;
  title: string | null;
  viewed_at: string;
}

function rowToEntry(row: HistoryRow): HistoryEntry | null {
  const viewedAt = Date.parse(row.viewed_at);
  if (Number.isNaN(viewedAt)) {
    return null;
  }
  if (row.type === 'isbn' && row.isbn) {
    return { type: 'isbn', isbn: row.isbn, viewedAt, ...(row.title ? { title: row.title } : {}) };
  }
  if (row.type === 'title' && row.title) {
    return { type: 'title', title: row.title, viewedAt };
  }
  return null;
}

function entryToRow(userId: string, entry: HistoryEntry): HistoryRow & { user_id: string } {
  return {
    user_id: userId,
    dedupe_key: historyEntryKey(entry),
    type: entry.type,
    isbn: entry.type === 'isbn' ? entry.isbn : null,
    title: entry.title ?? null,
    viewed_at: new Date(entry.viewedAt).toISOString(),
  };
}

/**
 * Merge two history lists. De-dupes by entry key, keeping the most recently
 * viewed copy (and preferring a copy that carries a title). Returns newest
 * first, capped to HISTORY_MAX_ENTRIES.
 */
export function mergeHistory(local: HistoryEntry[], remote: HistoryEntry[]): HistoryEntry[] {
  const byKey = new Map<string, HistoryEntry>();

  for (const entry of [...local, ...remote]) {
    const key = historyEntryKey(entry);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, entry);
      continue;
    }
    const newest = entry.viewedAt >= existing.viewedAt ? entry : existing;
    const title =
      ('title' in newest && newest.title) ||
      ('title' in existing && existing.title) ||
      ('title' in entry && entry.title) ||
      undefined;
    byKey.set(key, title && newest.type === 'isbn' ? { ...newest, title } : newest);
  }

  return Array.from(byKey.values())
    .sort((a, b) => b.viewedAt - a.viewedAt)
    .slice(0, HISTORY_MAX_ENTRIES);
}

async function pullRemoteHistory(supabase: SupabaseClient): Promise<HistoryEntry[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('dedupe_key,type,isbn,title,viewed_at')
    .order('viewed_at', { ascending: false })
    .limit(HISTORY_MAX_ENTRIES);

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => rowToEntry(row as HistoryRow)).filter(isEntry);
}

function isEntry(value: HistoryEntry | null): value is HistoryEntry {
  return value !== null;
}

/** Upsert the given entries for the current user (background, best-effort). */
export async function pushHistory(
  supabase: SupabaseClient,
  userId: string,
  entries: HistoryEntry[]
): Promise<void> {
  if (entries.length === 0) {
    return;
  }
  const { error } = await supabase.from(TABLE).upsert(
    entries.map((entry) => entryToRow(userId, entry)),
    { onConflict: 'user_id,dedupe_key' }
  );
  if (error) {
    throw error;
  }
}

/**
 * Background upsert of the given entries for the signed-in user. No-op when
 * Supabase is not configured or no user is signed in.
 */
export async function remoteUpsertHistory(entries: HistoryEntry[]): Promise<void> {
  const account = await getActiveAccount();
  if (!account) {
    return;
  }
  await pushHistory(account.supabase, account.userId, entries);
}

/** Delete all of the signed-in user's remote history (mirrors clearHistory). */
export async function remoteClearHistory(): Promise<void> {
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
 * push the merged set back so both sides converge. Returns the merged list.
 */
export async function syncHistory(
  supabase: SupabaseClient,
  userId: string
): Promise<HistoryEntry[]> {
  const [local, remote] = await Promise.all([loadHistory(), pullRemoteHistory(supabase)]);
  const merged = mergeHistory(local, remote);
  await replaceHistory(merged);
  await pushHistory(supabase, userId, merged);
  return merged;
}
