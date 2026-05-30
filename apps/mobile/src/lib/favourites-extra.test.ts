import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  addFavourite,
  clearFavourites,
  FAVOURITES_STORAGE_KEY,
  loadFavourites,
} from './favourites';

describe('favourites storage extra coverage', () => {
  beforeEach(async () => {
    jest.restoreAllMocks();
    await AsyncStorage.clear();
  });

  it('returns an empty list when stored favourites are not an array', async () => {
    await AsyncStorage.setItem(FAVOURITES_STORAGE_KEY, JSON.stringify({ isbn: '9781402894626' }));

    await expect(loadFavourites()).resolves.toEqual([]);
  });

  it('returns current favourites when addFavourite receives blank data', async () => {
    await AsyncStorage.setItem(
      FAVOURITES_STORAGE_KEY,
      JSON.stringify([{ isbn: '9781402894626', title: '設計中的書', addedAt: 1 }])
    );

    await expect(addFavourite({ isbn: '', title: '   ' })).resolves.toEqual([
      { isbn: '9781402894626', title: '設計中的書', addedAt: 1 },
    ]);
  });

  it('clears all stored favourites', async () => {
    await AsyncStorage.setItem(
      FAVOURITES_STORAGE_KEY,
      JSON.stringify([{ isbn: '9781402894626', title: '設計中的書', addedAt: 1 }])
    );

    await expect(clearFavourites()).resolves.toEqual([]);
    await expect(loadFavourites()).resolves.toEqual([]);
  });
});
