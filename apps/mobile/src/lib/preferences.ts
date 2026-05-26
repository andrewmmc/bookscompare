import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

export const PREFERENCES_STORAGE_KEY = 'bookscompare:preferences:v1';

export type OpenLinksIn = 'app' | 'browser';
export type ThemeMode = 'system' | 'light' | 'dark';

export interface Preferences {
  openLinksIn: OpenLinksIn;
  themeMode: ThemeMode;
}

type PreferenceKey = keyof Preferences;

const defaultPreferences: Preferences = {
  openLinksIn: 'app',
  themeMode: 'system',
};

const validators: {
  [Key in PreferenceKey]: (value: unknown) => value is Preferences[Key];
} = {
  openLinksIn: (value): value is OpenLinksIn => value === 'app' || value === 'browser',
  themeMode: (value): value is ThemeMode =>
    value === 'system' || value === 'light' || value === 'dark',
};

let currentPreferences = defaultPreferences;
const listeners = new Set<(preferences: Preferences) => void>();

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

export async function loadPreferences(): Promise<Preferences> {
  try {
    const raw = await AsyncStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (!raw) {
      emit(defaultPreferences);
      return defaultPreferences;
    }

    const preferences = parsePreferences(JSON.parse(raw));
    emit(preferences);
    return preferences;
  } catch {
    emit(defaultPreferences);
    return defaultPreferences;
  }
}

async function savePreferences(preferences: Preferences): Promise<void> {
  await AsyncStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
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
