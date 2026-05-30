import AsyncStorage from '@react-native-async-storage/async-storage';

import { addHistoryEntry, clearHistory, HISTORY_STORAGE_KEY, loadHistory } from './history';

describe('history storage extra coverage', () => {
  beforeEach(async () => {
    jest.restoreAllMocks();
    await AsyncStorage.clear();
  });

  it('returns an empty list when stored history is not an array', async () => {
    await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify({ type: 'isbn' }));

    await expect(loadHistory()).resolves.toEqual([]);
  });

  it('returns current history when a title entry is blank', async () => {
    await AsyncStorage.setItem(
      HISTORY_STORAGE_KEY,
      JSON.stringify([{ type: 'title', title: '設計中的書', viewedAt: 1 }])
    );

    await expect(addHistoryEntry({ type: 'title', title: '   ' })).resolves.toEqual([
      { type: 'title', title: '設計中的書', viewedAt: 1 },
    ]);
  });

  it('clears all stored history entries', async () => {
    await AsyncStorage.setItem(
      HISTORY_STORAGE_KEY,
      JSON.stringify([{ type: 'title', title: '設計中的書', viewedAt: 1 }])
    );

    await expect(clearHistory()).resolves.toEqual([]);
    await expect(loadHistory()).resolves.toEqual([]);
  });
});
