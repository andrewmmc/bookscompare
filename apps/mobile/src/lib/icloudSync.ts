import { Platform } from 'react-native';

import { normalizeIsbn } from '@bookscompare/contracts';

import { loadFavourites, parseFavourites, replaceFavourites, type Favourite } from './favourites';
import {
  loadHistory,
  parseHistory,
  replaceHistory,
  HISTORY_MAX_ENTRIES,
  type HistoryEntry,
} from './history';
import {
  loadPreferences,
  loadPreferencesUpdatedAt,
  replacePreferences,
  toSyncablePreferences,
  type Preferences,
  type SyncablePreferences,
} from './preferences';
import { getIcloudString, isIcloudStorageAvailable, setIcloudString } from './icloudStorage';

export const ICLOUD_PREFERENCES_KEY = 'bookscompare:icloud:preferences:v1';
export const ICLOUD_HISTORY_KEY = 'bookscompare:icloud:history:v1';
export const ICLOUD_FAVOURITES_KEY = 'bookscompare:icloud:favourites:v1';

interface IcloudPayload<T> {
  schemaVersion: 1;
  updatedAt: number;
  value: T;
}

interface InitialIcloudSyncResult {
  preferences?: Preferences;
  history?: HistoryEntry[];
  favourites?: Favourite[];
}

function canUseIcloudSync(preferences: Preferences): boolean {
  return Platform.OS === 'ios' && preferences.icloudSyncEnabled && isIcloudStorageAvailable();
}

function parseJsonPayload<T>(
  raw: string | null,
  parseValue: (value: unknown) => T
): IcloudPayload<T> | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      parsed.schemaVersion !== 1 ||
      typeof parsed.updatedAt !== 'number' ||
      !Number.isFinite(parsed.updatedAt)
    ) {
      return null;
    }

    return {
      schemaVersion: 1,
      updatedAt: parsed.updatedAt,
      value: parseValue(parsed.value),
    };
  } catch {
    return null;
  }
}

function writePayload<T>(key: string, updatedAt: number, value: T): boolean {
  return setIcloudString(
    key,
    JSON.stringify({
      schemaVersion: 1,
      updatedAt,
      value,
    })
  );
}

function hasSameJsonValue(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function parseSyncablePreferences(value: unknown): SyncablePreferences {
  if (!value || typeof value !== 'object') {
    throw new Error('Invalid iCloud preferences payload');
  }

  const record = value as Record<string, unknown>;
  return toSyncablePreferences({
    openLinksIn: record.openLinksIn === 'browser' ? 'browser' : 'app',
    themeMode:
      record.themeMode === 'light' || record.themeMode === 'dark' || record.themeMode === 'system'
        ? record.themeMode
        : 'system',
    preferredSources: Array.isArray(record.preferredSources) ? record.preferredSources : [],
    preferredBookTypes: Array.isArray(record.preferredBookTypes)
      ? record.preferredBookTypes.filter((value) => value === 'physical' || value === 'ebook')
      : [],
    icloudSyncEnabled: true,
  } as Preferences);
}

function normalizeTitle(title: string): string {
  return title.trim().toLocaleLowerCase();
}

function historyIdentity(entry: HistoryEntry): string {
  return entry.type === 'isbn' ? `isbn:${entry.isbn}` : `title:${normalizeTitle(entry.title)}`;
}

export function mergeHistoryEntries(
  localEntries: HistoryEntry[],
  remoteEntries: HistoryEntry[]
): HistoryEntry[] {
  const byIdentity = new Map<string, HistoryEntry>();

  [...remoteEntries, ...localEntries].forEach((entry) => {
    const key = historyIdentity(entry);
    const existing = byIdentity.get(key);
    if (!existing || entry.viewedAt > existing.viewedAt) {
      byIdentity.set(key, entry);
      return;
    }

    if (existing.type === 'isbn' && entry.type === 'isbn' && !existing.title && entry.title) {
      byIdentity.set(key, { ...existing, title: entry.title });
    }
  });

  return Array.from(byIdentity.values())
    .sort((a, b) => b.viewedAt - a.viewedAt)
    .slice(0, HISTORY_MAX_ENTRIES);
}

export function mergeFavourites(
  localFavourites: Favourite[],
  remoteFavourites: Favourite[]
): Favourite[] {
  const byIsbn = new Map<string, Favourite>();

  [...remoteFavourites, ...localFavourites].forEach((favourite) => {
    const isbn = normalizeIsbn(favourite.isbn);
    if (!isbn) {
      return;
    }

    const normalized = { ...favourite, isbn };
    const existing = byIsbn.get(isbn);
    if (!existing || normalized.addedAt > existing.addedAt) {
      byIsbn.set(isbn, normalized);
      return;
    }

    if (!existing.title && normalized.title) {
      byIsbn.set(isbn, { ...existing, title: normalized.title });
    }
  });

  return Array.from(byIsbn.values()).sort((a, b) => b.addedAt - a.addedAt);
}

export async function syncPreferencesToIcloud(preferences: Preferences): Promise<void> {
  if (!canUseIcloudSync(preferences)) {
    return;
  }

  const updatedAt = await loadPreferencesUpdatedAt();
  writePayload(ICLOUD_PREFERENCES_KEY, updatedAt || Date.now(), toSyncablePreferences(preferences));
}

export async function syncHistoryToIcloud(history: HistoryEntry[]): Promise<void> {
  const preferences = await loadPreferences();
  if (!canUseIcloudSync(preferences)) {
    return;
  }

  const remote = parseJsonPayload(getIcloudString(ICLOUD_HISTORY_KEY), parseHistory);
  const merged = remote ? mergeHistoryEntries(history, remote.value) : history;
  writePayload(ICLOUD_HISTORY_KEY, Date.now(), merged);
}

export async function syncFavouritesToIcloud(favourites: Favourite[]): Promise<void> {
  const preferences = await loadPreferences();
  if (!canUseIcloudSync(preferences)) {
    return;
  }

  const remote = parseJsonPayload(getIcloudString(ICLOUD_FAVOURITES_KEY), parseFavourites);
  const merged = remote ? mergeFavourites(favourites, remote.value) : favourites;
  writePayload(ICLOUD_FAVOURITES_KEY, Date.now(), merged);
}

export async function runInitialIcloudSync(): Promise<InitialIcloudSyncResult> {
  const preferences = await loadPreferences();
  if (!canUseIcloudSync(preferences)) {
    return {};
  }

  const result: InitialIcloudSyncResult = {};
  const localPreferencesUpdatedAt = await loadPreferencesUpdatedAt();
  const remotePreferences = parseJsonPayload(
    getIcloudString(ICLOUD_PREFERENCES_KEY),
    parseSyncablePreferences
  );
  const nextPreferences =
    remotePreferences && remotePreferences.updatedAt > localPreferencesUpdatedAt
      ? { ...remotePreferences.value, icloudSyncEnabled: preferences.icloudSyncEnabled }
      : preferences;
  const nextPreferencesUpdatedAt = Math.max(
    localPreferencesUpdatedAt,
    remotePreferences?.updatedAt ?? 0,
    Date.now()
  );

  if (!hasSameJsonValue(nextPreferences, preferences)) {
    result.preferences = await replacePreferences(nextPreferences, nextPreferencesUpdatedAt);
  }
  writePayload(
    ICLOUD_PREFERENCES_KEY,
    nextPreferencesUpdatedAt,
    toSyncablePreferences(nextPreferences)
  );

  const localHistory = await loadHistory();
  const remoteHistory = parseJsonPayload(getIcloudString(ICLOUD_HISTORY_KEY), parseHistory);
  const nextHistory = remoteHistory
    ? mergeHistoryEntries(localHistory, remoteHistory.value)
    : localHistory;
  if (!hasSameJsonValue(nextHistory, localHistory)) {
    result.history = await replaceHistory(nextHistory);
  } else {
    result.history = nextHistory;
  }
  writePayload(ICLOUD_HISTORY_KEY, Date.now(), nextHistory);

  const localFavourites = await loadFavourites();
  const remoteFavourites = parseJsonPayload(
    getIcloudString(ICLOUD_FAVOURITES_KEY),
    parseFavourites
  );
  const nextFavourites = remoteFavourites
    ? mergeFavourites(localFavourites, remoteFavourites.value)
    : localFavourites;
  if (!hasSameJsonValue(nextFavourites, localFavourites)) {
    result.favourites = await replaceFavourites(nextFavourites);
  } else {
    result.favourites = nextFavourites;
  }
  writePayload(ICLOUD_FAVOURITES_KEY, Date.now(), nextFavourites);

  return result;
}
