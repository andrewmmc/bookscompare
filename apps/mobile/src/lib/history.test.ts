import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  addHistoryEntry,
  clearHistory,
  HISTORY_MAX_ENTRIES,
  HISTORY_STORAGE_KEY,
  loadHistory,
} from './history';

describe('history storage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.restoreAllMocks();
  });

  it('returns an empty list when storage is empty', async () => {
    expect(await loadHistory()).toEqual([]);
  });

  it('adds isbn and title entries sorted newest-first', async () => {
    jest.spyOn(Date, 'now').mockReturnValueOnce(1000);
    await addHistoryEntry({ type: 'isbn', isbn: '978-1402894626', title: 'Book A' });

    jest.spyOn(Date, 'now').mockReturnValueOnce(2000);
    await addHistoryEntry({ type: 'title', title: '哈利波特' });

    const stored = await loadHistory();
    expect(stored).toEqual([
      { type: 'title', title: '哈利波特', viewedAt: 2000 },
      { type: 'isbn', isbn: '9781402894626', title: 'Book A', viewedAt: 1000 },
    ]);
  });

  it('dedupes by ISBN and bumps to top, preserving prior title when not provided', async () => {
    jest.spyOn(Date, 'now').mockReturnValueOnce(1000);
    await addHistoryEntry({ type: 'isbn', isbn: '9781402894626', title: 'Original' });

    jest.spyOn(Date, 'now').mockReturnValueOnce(5000);
    await addHistoryEntry({ type: 'isbn', isbn: '9781402894626' });

    const stored = await loadHistory();
    expect(stored).toEqual([
      { type: 'isbn', isbn: '9781402894626', title: 'Original', viewedAt: 5000 },
    ]);
  });

  it('updates ISBN title when a new title is supplied', async () => {
    jest.spyOn(Date, 'now').mockReturnValueOnce(1000);
    await addHistoryEntry({ type: 'isbn', isbn: '9781402894626' });

    jest.spyOn(Date, 'now').mockReturnValueOnce(2000);
    await addHistoryEntry({ type: 'isbn', isbn: '9781402894626', title: 'Resolved Title' });

    const stored = await loadHistory();
    expect(stored).toEqual([
      { type: 'isbn', isbn: '9781402894626', title: 'Resolved Title', viewedAt: 2000 },
    ]);
  });

  it('dedupes title-search entries', async () => {
    jest.spyOn(Date, 'now').mockReturnValueOnce(1000);
    await addHistoryEntry({ type: 'title', title: '哈利波特' });

    jest.spyOn(Date, 'now').mockReturnValueOnce(2000);
    await addHistoryEntry({ type: 'title', title: '哈利波特' });

    const stored = await loadHistory();
    expect(stored).toEqual([{ type: 'title', title: '哈利波特', viewedAt: 2000 }]);
  });

  it('caps history at HISTORY_MAX_ENTRIES, keeping the newest', async () => {
    for (let i = 0; i < HISTORY_MAX_ENTRIES + 5; i += 1) {
      jest.spyOn(Date, 'now').mockReturnValueOnce(1000 + i);
      await addHistoryEntry({ type: 'title', title: `search-${i}` });
    }

    const stored = await loadHistory();
    expect(stored).toHaveLength(HISTORY_MAX_ENTRIES);
    expect(stored[0]).toEqual({
      type: 'title',
      title: `search-${HISTORY_MAX_ENTRIES + 4}`,
      viewedAt: 1000 + HISTORY_MAX_ENTRIES + 4,
    });
    // Oldest five entries should have been evicted
    expect(stored.map((e) => (e.type === 'title' ? e.title : ''))).not.toContain('search-0');
    expect(stored.map((e) => (e.type === 'title' ? e.title : ''))).not.toContain('search-4');
  });

  it('ignores invalid input', async () => {
    expect(await addHistoryEntry({ type: 'isbn', isbn: '' })).toEqual([]);
    expect(await addHistoryEntry({ type: 'title', title: '   ' })).toEqual([]);
  });

  it('clears history', async () => {
    await addHistoryEntry({ type: 'title', title: 'something' });
    expect(await loadHistory()).toHaveLength(1);
    await clearHistory();
    expect(await loadHistory()).toEqual([]);
  });

  it('returns an empty list when stored payload is corrupt', async () => {
    await AsyncStorage.setItem(HISTORY_STORAGE_KEY, '{not json');
    expect(await loadHistory()).toEqual([]);
  });

  it('filters out malformed entries on load', async () => {
    await AsyncStorage.setItem(
      HISTORY_STORAGE_KEY,
      JSON.stringify([
        { type: 'isbn', isbn: '9781402894626', viewedAt: 1000 },
        { type: 'isbn', isbn: 'no-time' },
        { type: 'title', title: 'ok', viewedAt: 2000 },
        { type: 'mystery', title: 'nope', viewedAt: 3000 },
        'not-an-object',
      ])
    );
    const stored = await loadHistory();
    expect(stored).toEqual([
      { type: 'title', title: 'ok', viewedAt: 2000 },
      { type: 'isbn', isbn: '9781402894626', viewedAt: 1000 },
    ]);
  });
});
