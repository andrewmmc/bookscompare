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
    await updatePreference('favouritesSortDirection', 'asc');
    await updatePreference('historySortDirection', 'asc');
    await addHistoryEntry({ type: 'title', title: '設計模式' });
    await addFavourite({ isbn: '9786264560092', title: '重構' });

    await expect(resetAppData()).resolves.toEqual({
      preferences: {
        languagePreference: 'system',
        openLinksIn: 'app',
        themeMode: 'system',
        preferredSources: [],
        preferredBookTypes: [],
        icloudSyncEnabled: true,
        analyticsEnabled: false,
        favouritesSortDirection: 'desc',
        historySortDirection: 'desc',
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
      analyticsEnabled: false,
      favouritesSortDirection: 'desc',
      historySortDirection: 'desc',
    });
    await expect(loadHistory()).resolves.toEqual([]);
    await expect(loadFavourites()).resolves.toEqual([]);
  });
});
