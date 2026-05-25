import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  addFavourite,
  FAVOURITES_STORAGE_KEY,
  loadFavourites,
  removeFavourite,
} from './favourites';

describe('favourites storage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.restoreAllMocks();
  });

  it('returns an empty list when storage is empty', async () => {
    expect(await loadFavourites()).toEqual([]);
  });

  it('adds a favourite normalised by ISBN and sorted newest-first', async () => {
    jest.spyOn(Date, 'now').mockReturnValueOnce(1000);
    await addFavourite({ isbn: '978-1402894626', title: 'Book A' });

    jest.spyOn(Date, 'now').mockReturnValueOnce(2000);
    await addFavourite({ isbn: '9789861336275', title: 'Book B' });

    const stored = await loadFavourites();
    expect(stored).toEqual([
      { isbn: '9789861336275', title: 'Book B', addedAt: 2000 },
      { isbn: '9781402894626', title: 'Book A', addedAt: 1000 },
    ]);
  });

  it('deduplicates by ISBN and refreshes addedAt on re-add', async () => {
    jest.spyOn(Date, 'now').mockReturnValueOnce(1000);
    await addFavourite({ isbn: '9781402894626', title: 'Old title' });

    jest.spyOn(Date, 'now').mockReturnValueOnce(5000);
    await addFavourite({ isbn: '9781402894626', title: 'New title' });

    const stored = await loadFavourites();
    expect(stored).toHaveLength(1);
    expect(stored[0]).toEqual({
      isbn: '9781402894626',
      title: 'New title',
      addedAt: 5000,
    });
  });

  it('ignores invalid input', async () => {
    const result = await addFavourite({ isbn: '', title: 'Nothing' });
    expect(result).toEqual([]);
  });

  it('removes a favourite by ISBN regardless of formatting', async () => {
    await addFavourite({ isbn: '9781402894626', title: 'Book A' });
    await addFavourite({ isbn: '9789861336275', title: 'Book B' });

    const remaining = await removeFavourite('978-1402894626');
    expect(remaining.map((f) => f.isbn)).toEqual(['9789861336275']);
  });

  it('returns an empty list when stored payload is corrupt', async () => {
    await AsyncStorage.setItem(FAVOURITES_STORAGE_KEY, '{not json');
    expect(await loadFavourites()).toEqual([]);
  });

  it('filters out malformed entries on load', async () => {
    await AsyncStorage.setItem(
      FAVOURITES_STORAGE_KEY,
      JSON.stringify([
        { isbn: '9781402894626', title: 'Valid', addedAt: 1000 },
        { isbn: 'no-time', title: 'No time' },
        'not-an-object',
      ])
    );
    const stored = await loadFavourites();
    expect(stored).toEqual([{ isbn: '9781402894626', title: 'Valid', addedAt: 1000 }]);
  });
});
