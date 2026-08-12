import { Platform } from 'react-native';

import { BOOK_SOURCES, normalizeIsbn } from '@bookscompare/contracts';

import {
  loadFavourites,
  loadFavouritesUpdatedAt,
  parseFavourites,
  replaceFavourites,
  type Favourite,
} from './favourites';
import {
  loadHistory,
  loadHistoryUpdatedAt,
  parseHistory,
  replaceHistory,
  HISTORY_MAX_ENTRIES,
  type HistoryEntry,
} from './history';
import {
  DEFAULT_PREFERENCES,
  loadPreferences,
  loadPreferencesUpdatedAt,
  replacePreferences,
  toSyncablePreferences,
  type Preferences,
  type SyncablePreferences,
} from './preferences';
import {
  getIcloudString,
  isIcloudStorageAvailable,
  removeIcloudValue,
  setIcloudString,
} from './icloudStorage';

export const ICLOUD_PREFERENCES_KEY = 'bookscompare:icloud:preferences:v1';
export const ICLOUD_HISTORY_KEY = 'bookscompare:icloud:history:v1';
export const ICLOUD_FAVOURITES_KEY = 'bookscompare:icloud:favourites:v1';

const validSourceIds = new Set<string>(BOOK_SOURCES.map((source) => source.id));

interface IcloudPayload<T> {
  schemaVersion: 1 | 2;
  updatedAt: number;
  value: T;
  deleted: Record<string, number>;
}

export interface InitialIcloudSyncResult {
  preferences?: Preferences;
  history?: HistoryEntry[];
  favourites?: Favourite[];
  pendingRemoteData?: boolean;
}

interface SyncListOptions {
  mergeRemote?: boolean;
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
      (parsed.schemaVersion !== 1 && parsed.schemaVersion !== 2) ||
      typeof parsed.updatedAt !== 'number' ||
      !Number.isFinite(parsed.updatedAt)
    ) {
      return null;
    }

    return {
      schemaVersion: parsed.schemaVersion,
      updatedAt: parsed.updatedAt,
      value: parseValue(parsed.value),
      deleted:
        parsed.schemaVersion === 2 && parsed.deleted && typeof parsed.deleted === 'object'
          ? Object.fromEntries(
              Object.entries(parsed.deleted as Record<string, unknown>).filter(
                (entry): entry is [string, number] =>
                  typeof entry[1] === 'number' && Number.isFinite(entry[1])
              )
            )
          : {},
    };
  } catch {
    return null;
  }
}

function writePayload<T>(
  key: string,
  updatedAt: number,
  value: T,
  deleted: Record<string, number> = {}
): void {
  const didWrite = setIcloudString(
    key,
    JSON.stringify({
      schemaVersion: 2,
      updatedAt,
      value,
      deleted,
    })
  );

  if (!didWrite) {
    throw new Error(`Failed to write iCloud value for ${key}`);
  }
}

function hasSameJsonValue(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function parseSyncablePreferences(value: unknown): SyncablePreferences {
  if (!value || typeof value !== 'object') {
    throw new Error('Invalid iCloud preferences payload');
  }

  const record = value as Record<string, unknown>;
  const preferredBookTypes = Array.isArray(record.preferredBookTypes)
    ? record.preferredBookTypes.filter((value) => value === 'physical' || value === 'ebook')
    : [];

  return toSyncablePreferences({
    openLinksIn: record.openLinksIn === 'browser' ? 'browser' : 'app',
    themeMode:
      record.themeMode === 'light' || record.themeMode === 'dark' || record.themeMode === 'system'
        ? record.themeMode
        : 'system',
    preferredSources: Array.isArray(record.preferredSources)
      ? record.preferredSources.filter(
          (value): value is Preferences['preferredSources'][number] =>
            typeof value === 'string' && validSourceIds.has(value)
        )
      : [],
    preferredBookTypes: Array.from(new Set(preferredBookTypes)),
    icloudSyncEnabled: true,
  } as Preferences);
}

function normalizeTitle(title: string): string {
  return title.trim().toLocaleLowerCase();
}

function historyIdentity(entry: HistoryEntry): string {
  return entry.type === 'isbn' ? `isbn:${entry.isbn}` : `title:${normalizeTitle(entry.title)}`;
}

function applyTombstones<T>(
  entries: T[],
  deleted: Record<string, number>,
  identity: (entry: T) => string,
  modifiedAt: (entry: T) => number
): T[] {
  return entries.filter((entry) => modifiedAt(entry) > (deleted[identity(entry)] ?? 0));
}

function tombstonesForRemoved<T>(
  remoteEntries: T[],
  localEntries: T[],
  existing: Record<string, number>,
  identity: (entry: T) => string,
  removedAt: number
): Record<string, number> {
  const localIds = new Set(localEntries.map(identity));
  const deleted = { ...existing };
  for (const entry of remoteEntries) {
    const id = identity(entry);
    if (!localIds.has(id)) deleted[id] = Math.max(deleted[id] ?? 0, removedAt);
  }
  return deleted;
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

export async function syncHistoryToIcloud(
  history: HistoryEntry[],
  options: SyncListOptions = {}
): Promise<HistoryEntry[] | null> {
  const preferences = await loadPreferences();
  if (!canUseIcloudSync(preferences)) {
    return null;
  }

  const shouldMergeRemote = options.mergeRemote ?? true;
  const remote = parseJsonPayload(getIcloudString(ICLOUD_HISTORY_KEY), parseHistory);
  const updatedAt = Date.now();
  const deleted =
    remote && !shouldMergeRemote
      ? tombstonesForRemoved(remote.value, history, remote.deleted, historyIdentity, updatedAt)
      : (remote?.deleted ?? {});
  const next = remote
    ? applyTombstones(
        mergeHistoryEntries(history, remote.value),
        deleted,
        historyIdentity,
        (entry) => entry.viewedAt
      )
    : history;
  if (remote && !hasSameJsonValue(next, history)) {
    await replaceHistory(next, updatedAt);
  }
  writePayload(ICLOUD_HISTORY_KEY, updatedAt, next, deleted);
  return next;
}

export async function syncFavouritesToIcloud(
  favourites: Favourite[],
  options: SyncListOptions = {}
): Promise<Favourite[] | null> {
  const preferences = await loadPreferences();
  if (!canUseIcloudSync(preferences)) {
    return null;
  }

  const shouldMergeRemote = options.mergeRemote ?? true;
  const remote = parseJsonPayload(getIcloudString(ICLOUD_FAVOURITES_KEY), parseFavourites);
  const updatedAt = Date.now();
  const favouriteIdentity = (entry: Favourite) => normalizeIsbn(entry.isbn);
  const deleted =
    remote && !shouldMergeRemote
      ? tombstonesForRemoved(remote.value, favourites, remote.deleted, favouriteIdentity, updatedAt)
      : (remote?.deleted ?? {});
  const next = remote
    ? applyTombstones(
        mergeFavourites(favourites, remote.value),
        deleted,
        favouriteIdentity,
        (entry) => entry.addedAt
      )
    : favourites;
  if (remote && !hasSameJsonValue(next, favourites)) {
    await replaceFavourites(next, updatedAt);
  }
  writePayload(ICLOUD_FAVOURITES_KEY, updatedAt, next, deleted);
  return next;
}

export async function clearIcloudData(): Promise<void> {
  const results = [
    removeIcloudValue(ICLOUD_PREFERENCES_KEY),
    removeIcloudValue(ICLOUD_HISTORY_KEY),
    removeIcloudValue(ICLOUD_FAVOURITES_KEY),
  ];

  if (results.some((didRemove) => !didRemove)) {
    throw new Error('Failed to clear all iCloud values');
  }
}

export async function runInitialIcloudSync(): Promise<InitialIcloudSyncResult> {
  const preferences = await loadPreferences();
  if (!canUseIcloudSync(preferences)) {
    return {};
  }

  const result: InitialIcloudSyncResult = {};
  const localPreferencesUpdatedAt = await loadPreferencesUpdatedAt();
  const localSyncablePreferences = toSyncablePreferences(preferences);
  const remotePreferences = parseJsonPayload(
    getIcloudString(ICLOUD_PREFERENCES_KEY),
    parseSyncablePreferences
  );
  const localHistory = await loadHistory();
  const localHistoryUpdatedAt = await loadHistoryUpdatedAt();
  const remoteHistory = parseJsonPayload(getIcloudString(ICLOUD_HISTORY_KEY), parseHistory);
  const localFavourites = await loadFavourites();
  const localFavouritesUpdatedAt = await loadFavouritesUpdatedAt();
  const remoteFavourites = parseJsonPayload(
    getIcloudString(ICLOUD_FAVOURITES_KEY),
    parseFavourites
  );

  if (remotePreferences) {
    const nextPreferences =
      remotePreferences.updatedAt > localPreferencesUpdatedAt
        ? {
            ...remotePreferences.value,
            icloudSyncEnabled: preferences.icloudSyncEnabled,
            analyticsEnabled: Boolean(preferences.analyticsEnabled),
          }
        : preferences;
    const nextPreferencesUpdatedAt = Math.max(
      localPreferencesUpdatedAt,
      remotePreferences.updatedAt,
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
  } else {
    const hasLocalPreferenceChanges = !hasSameJsonValue(
      localSyncablePreferences,
      toSyncablePreferences(DEFAULT_PREFERENCES)
    );
    if (localPreferencesUpdatedAt > 0 || hasLocalPreferenceChanges) {
      writePayload(
        ICLOUD_PREFERENCES_KEY,
        localPreferencesUpdatedAt || Date.now(),
        localSyncablePreferences
      );
    } else {
      result.pendingRemoteData = true;
    }
  }

  if (remoteHistory) {
    const nextHistory =
      remoteHistory.schemaVersion === 1 && remoteHistory.updatedAt !== localHistoryUpdatedAt
        ? remoteHistory.updatedAt > localHistoryUpdatedAt
          ? remoteHistory.value
          : localHistory
        : applyTombstones(
            mergeHistoryEntries(localHistory, remoteHistory.value),
            remoteHistory.deleted,
            historyIdentity,
            (entry) => entry.viewedAt
          );
    const nextHistoryUpdatedAt = Math.max(localHistoryUpdatedAt, remoteHistory.updatedAt);
    if (!hasSameJsonValue(nextHistory, localHistory)) {
      result.history = await replaceHistory(nextHistory, nextHistoryUpdatedAt);
    } else {
      result.history = nextHistory;
    }
    writePayload(ICLOUD_HISTORY_KEY, nextHistoryUpdatedAt, nextHistory, remoteHistory.deleted);
  } else {
    result.history = localHistory;
    if (localHistory.length > 0) {
      writePayload(ICLOUD_HISTORY_KEY, Date.now(), localHistory);
    } else {
      result.pendingRemoteData = true;
    }
  }

  if (remoteFavourites) {
    const nextFavourites =
      remoteFavourites.schemaVersion === 1 &&
      remoteFavourites.updatedAt !== localFavouritesUpdatedAt
        ? remoteFavourites.updatedAt > localFavouritesUpdatedAt
          ? remoteFavourites.value
          : localFavourites
        : applyTombstones(
            mergeFavourites(localFavourites, remoteFavourites.value),
            remoteFavourites.deleted,
            (entry) => normalizeIsbn(entry.isbn),
            (entry) => entry.addedAt
          );
    const nextFavouritesUpdatedAt = Math.max(localFavouritesUpdatedAt, remoteFavourites.updatedAt);
    if (!hasSameJsonValue(nextFavourites, localFavourites)) {
      result.favourites = await replaceFavourites(nextFavourites, nextFavouritesUpdatedAt);
    } else {
      result.favourites = nextFavourites;
    }
    writePayload(
      ICLOUD_FAVOURITES_KEY,
      nextFavouritesUpdatedAt,
      nextFavourites,
      remoteFavourites.deleted
    );
  } else {
    result.favourites = localFavourites;
    if (localFavourites.length > 0) {
      writePayload(ICLOUD_FAVOURITES_KEY, Date.now(), localFavourites);
    } else {
      result.pendingRemoteData = true;
    }
  }

  return result;
}
