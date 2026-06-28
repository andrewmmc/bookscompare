import { useEffect, useState } from 'react';

import { BOOK_SOURCES } from '@bookscompare/contracts';

import { loadJsonValue, saveJsonValue } from './jsonStorage';

import type { BookSourceId } from '@bookscompare/contracts';

export const PREFERENCES_STORAGE_KEY = 'bookscompare:preferences:v1';

export type OpenLinksIn = 'app' | 'browser';
export type ThemeMode = 'system' | 'light' | 'dark';
export type BookTypePreference = 'physical' | 'ebook';

export interface Preferences {
  openLinksIn: OpenLinksIn;
  themeMode: ThemeMode;
  preferredSources: BookSourceId[];
  preferredBookTypes: BookTypePreference[];
  icloudSyncEnabled: boolean;
}

type PreferenceKey = keyof Preferences;

const validSourceIds = new Set<string>(BOOK_SOURCES.map((s) => s.id));

const defaultPreferences: Preferences = {
  openLinksIn: 'app',
  themeMode: 'system',
  preferredSources: [],
  preferredBookTypes: [],
  icloudSyncEnabled: true,
};

const validators: {
  [Key in PreferenceKey]: (value: unknown) => value is Preferences[Key];
} = {
  openLinksIn: (value): value is OpenLinksIn => value === 'app' || value === 'browser',
  themeMode: (value): value is ThemeMode =>
    value === 'system' || value === 'light' || value === 'dark',
  preferredSources: (value): value is BookSourceId[] =>
    Array.isArray(value) && value.every((v) => typeof v === 'string' && validSourceIds.has(v)),
  preferredBookTypes: (value): value is BookTypePreference[] =>
    Array.isArray(value) &&
    value.every((v) => v === 'physical' || v === 'ebook') &&
    new Set(value).size === value.length,
  icloudSyncEnabled: (value): value is boolean => typeof value === 'boolean',
};

let currentPreferences = defaultPreferences;
let preferencesLoaded = false;
const listeners = new Set<(preferences: Preferences) => void>();
const loadedListeners = new Set<(loaded: boolean) => void>();

function parsePreferences(value: unknown): Preferences {
  if (!value || typeof value !== 'object') {
    return defaultPreferences;
  }

  const record = value as Record<string, unknown>;
  return (Object.keys(defaultPreferences) as PreferenceKey[]).reduce<Preferences>(
    (preferences, key) => ({
      ...preferences,
      [key]: validators[key](record[key]) ? record[key] : defaultPreferences[key],
    }),
    defaultPreferences
  );
}

function emit(preferences: Preferences): void {
  currentPreferences = preferences;
  listeners.forEach((listener) => listener(preferences));
}

function markLoaded(): void {
  if (preferencesLoaded) {
    return;
  }
  preferencesLoaded = true;
  loadedListeners.forEach((listener) => listener(true));
}

let inFlightLoad: Promise<Preferences> | null = null;

export async function loadPreferences(): Promise<Preferences> {
  if (inFlightLoad) {
    return inFlightLoad;
  }

  inFlightLoad = (async () => {
    try {
      const preferences = await loadJsonValue(
        PREFERENCES_STORAGE_KEY,
        defaultPreferences,
        parsePreferences
      );
      emit(preferences);
      return preferences;
    } finally {
      markLoaded();
    }
  })();

  return inFlightLoad;
}

// Kick off the load as soon as the module is imported so the splash/initial
// render has the best chance of having the user's saved theme ready.
void loadPreferences();

async function savePreferences(preferences: Preferences): Promise<void> {
  await saveJsonValue(PREFERENCES_STORAGE_KEY, preferences);
}

export async function updatePreference<Key extends PreferenceKey>(
  key: Key,
  value: Preferences[Key]
): Promise<Preferences> {
  const next = { ...currentPreferences, [key]: value };
  await savePreferences(next);
  emit(next);
  return next;
}

export function usePreferences(): Preferences {
  const [preferences, setPreferences] = useState(currentPreferences);

  useEffect(() => {
    listeners.add(setPreferences);
    void loadPreferences();

    return () => {
      listeners.delete(setPreferences);
    };
  }, []);

  return preferences;
}

export function usePreferencesLoaded(): boolean {
  const [loaded, setLoaded] = useState(preferencesLoaded);

  useEffect(() => {
    if (loaded) {
      return;
    }

    loadedListeners.add(setLoaded);
    void loadPreferences();

    return () => {
      loadedListeners.delete(setLoaded);
    };
  }, [loaded]);

  return loaded;
}
