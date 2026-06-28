import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Preferences } from './preferences';

function importPreferences(): typeof import('./preferences') {
  let preferencesModule: typeof import('./preferences') | undefined;

  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    preferencesModule = require('./preferences') as typeof import('./preferences');
  });

  if (!preferencesModule) {
    throw new Error('Failed to import preferences module.');
  }

  return preferencesModule;
}

describe('preferences storage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('returns defaults when storage is empty', async () => {
    const { loadPreferences } = importPreferences();

    await expect(loadPreferences()).resolves.toEqual({
      openLinksIn: 'app',
      themeMode: 'system',
      preferredSources: [],
      preferredBookTypes: [],
      icloudSyncEnabled: true,
    });
  });

  it('loads valid stored preferences', async () => {
    const stored: Preferences = {
      openLinksIn: 'browser',
      themeMode: 'dark',
      preferredSources: ['books-com-tw', 'kingstone'],
      preferredBookTypes: ['physical', 'ebook'],
      icloudSyncEnabled: false,
    };
    await AsyncStorage.setItem('bookscompare:preferences:v1', JSON.stringify(stored));

    const { loadPreferences } = importPreferences();

    await expect(loadPreferences()).resolves.toEqual(stored);
  });

  it('falls back invalid stored fields independently', async () => {
    await AsyncStorage.setItem(
      'bookscompare:preferences:v1',
      JSON.stringify({
        openLinksIn: 'sideways',
        themeMode: 'light',
        preferredSources: ['books-com-tw', 'unknown-source'],
        preferredBookTypes: ['ebook', 'ebook'],
        icloudSyncEnabled: 'yes',
      })
    );

    const { loadPreferences } = importPreferences();

    await expect(loadPreferences()).resolves.toEqual({
      openLinksIn: 'app',
      themeMode: 'light',
      preferredSources: [],
      preferredBookTypes: [],
      icloudSyncEnabled: true,
    });
  });

  it('returns defaults when stored JSON is corrupt', async () => {
    await AsyncStorage.setItem('bookscompare:preferences:v1', '{not json');

    const { loadPreferences } = importPreferences();

    await expect(loadPreferences()).resolves.toEqual({
      openLinksIn: 'app',
      themeMode: 'system',
      preferredSources: [],
      preferredBookTypes: [],
      icloudSyncEnabled: true,
    });
  });

  it('persists preference updates', async () => {
    const { PREFERENCES_STORAGE_KEY, updatePreference } = importPreferences();

    const next = await updatePreference('openLinksIn', 'browser');
    const stored = await AsyncStorage.getItem(PREFERENCES_STORAGE_KEY);

    expect(next.openLinksIn).toBe('browser');
    expect(JSON.parse(stored ?? '{}')).toEqual(next);
  });
});
