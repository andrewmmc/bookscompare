import AsyncStorage from '@react-native-async-storage/async-storage';

import { addFavourite, loadFavourites } from './favourites';
import { addHistoryEntry, loadHistory } from './history';
import { resetAppData } from './appData';
import { loadPreferences, updatePreference } from './preferences';

describe('app data reset', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('resets preferences, history, and favourites to defaults', async () => {
    await updatePreference('openLinksIn', 'browser');
    await updatePreference('themeMode', 'dark');
    await addHistoryEntry({ type: 'title', title: '設計模式' });
    await addFavourite({ isbn: '9786264560092', title: '重構' });

    await expect(resetAppData()).resolves.toEqual({
      preferences: {
        openLinksIn: 'app',
        themeMode: 'system',
        preferredSources: [],
        preferredBookTypes: [],
        icloudSyncEnabled: true,
      },
      history: [],
      favourites: [],
    });

    await expect(loadPreferences()).resolves.toEqual({
      openLinksIn: 'app',
      themeMode: 'system',
      preferredSources: [],
      preferredBookTypes: [],
      icloudSyncEnabled: true,
    });
    await expect(loadHistory()).resolves.toEqual([]);
    await expect(loadFavourites()).resolves.toEqual([]);
  });
});
