import { normalizeIsbn } from '@bookscompare/contracts';

import { loadJsonValue, saveJsonValue } from './jsonStorage';

export const HISTORY_STORAGE_KEY = 'bookscompare:history:v1';
export const HISTORY_MAX_ENTRIES = 20;

export type HistoryEntry =
  | { type: 'isbn'; isbn: string; title?: string; viewedAt: number }
  | { type: 'title'; title: string; viewedAt: number };

export type HistoryInput =
  | { type: 'isbn'; isbn: string; title?: string }
  | { type: 'title'; title: string };

function parseHistory(value: unknown): HistoryEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isHistoryEntry).sort((a, b) => b.viewedAt - a.viewedAt);
}

function isHistoryEntry(value: unknown): value is HistoryEntry {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const record = value as Record<string, unknown>;
  if (typeof record.viewedAt !== 'number') {
    return false;
  }
  if (record.type === 'isbn') {
    return (
      typeof record.isbn === 'string' &&
      (record.title === undefined || typeof record.title === 'string')
    );
  }
  if (record.type === 'title') {
    return typeof record.title === 'string';
  }
  return false;
}

export async function loadHistory(): Promise<HistoryEntry[]> {
  return loadJsonValue(HISTORY_STORAGE_KEY, [], parseHistory);
}

async function saveHistory(list: HistoryEntry[]): Promise<void> {
  await saveJsonValue(HISTORY_STORAGE_KEY, list);
}

function isSameEntry(a: HistoryEntry, b: HistoryEntry): boolean {
  if (a.type === 'isbn' && b.type === 'isbn') {
    return a.isbn === b.isbn;
  }
  if (a.type === 'title' && b.type === 'title') {
    return a.title === b.title;
  }
  return false;
}

export async function addHistoryEntry(input: HistoryInput): Promise<HistoryEntry[]> {
  const current = await loadHistory();
  let entry: HistoryEntry;

  if (input.type === 'isbn') {
    const isbn = normalizeIsbn(input.isbn);
    if (!isbn) {
      return current;
    }
    const trimmedTitle = input.title?.trim();
    const existing = current.find(
      (item): item is Extract<HistoryEntry, { type: 'isbn' }> =>
        item.type === 'isbn' && item.isbn === isbn
    );
    const title = trimmedTitle || existing?.title;
    entry = {
      type: 'isbn',
      isbn,
      viewedAt: Date.now(),
      ...(title ? { title } : {}),
    };
  } else {
    const title = input.title.trim();
    if (!title) {
      return current;
    }
    entry = { type: 'title', title, viewedAt: Date.now() };
  }

  const filtered = current.filter((item) => !isSameEntry(item, entry));
  const next = [entry, ...filtered].slice(0, HISTORY_MAX_ENTRIES);
  await saveHistory(next);
  return next;
}

export async function clearHistory(): Promise<HistoryEntry[]> {
  await saveHistory([]);
  return [];
}
