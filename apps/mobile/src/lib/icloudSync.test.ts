jest.mock('./history', () => {
  const actual = jest.requireActual<typeof import('./history')>('./history');
  return {
    ...actual,
    loadHistory: jest.fn(),
    replaceHistory: jest.fn(),
  };
});

jest.mock('./favourites', () => {
  const actual = jest.requireActual<typeof import('./favourites')>('./favourites');
  return {
    ...actual,
    loadFavourites: jest.fn(),
    replaceFavourites: jest.fn(),
  };
});

jest.mock('./preferences', () => {
  const actual = jest.requireActual<typeof import('./preferences')>('./preferences');
  return {
    ...actual,
    loadPreferences: jest.fn(),
    loadPreferencesUpdatedAt: jest.fn(),
    replacePreferences: jest.fn(),
  };
});

jest.mock('./icloudStorage', () => ({
  getIcloudString: jest.fn(),
  isIcloudStorageAvailable: jest.fn(),
  removeIcloudValue: jest.fn(),
  setIcloudString: jest.fn(),
}));

import { loadFavourites, replaceFavourites } from './favourites';
import { loadHistory, replaceHistory, HISTORY_MAX_ENTRIES, type HistoryEntry } from './history';
import { getIcloudString, isIcloudStorageAvailable, setIcloudString } from './icloudStorage';
import {
  ICLOUD_FAVOURITES_KEY,
  ICLOUD_HISTORY_KEY,
  mergeFavourites,
  mergeHistoryEntries,
  runInitialIcloudSync,
} from './icloudSync';
import { DEFAULT_PREFERENCES, loadPreferences, loadPreferencesUpdatedAt } from './preferences';

describe('iCloud sync merge helpers', () => {
  it('merges history by identity, keeps newest entries, and preserves ISBN titles', () => {
    const local: HistoryEntry[] = [
      { type: 'isbn', isbn: '9786264560092', title: 'Local title', viewedAt: 200 },
      { type: 'title', title: '  TypeScript  ', viewedAt: 100 },
    ];
    const remote: HistoryEntry[] = [
      { type: 'isbn', isbn: '9786264560092', viewedAt: 300 },
      { type: 'title', title: 'typescript', viewedAt: 250 },
      { type: 'title', title: 'React Native', viewedAt: 150 },
    ];

    expect(mergeHistoryEntries(local, remote)).toEqual([
      { type: 'isbn', isbn: '9786264560092', viewedAt: 300, title: 'Local title' },
      { type: 'title', title: 'typescript', viewedAt: 250 },
      { type: 'title', title: 'React Native', viewedAt: 150 },
    ]);
  });

  it('caps merged history at the existing history limit', () => {
    const local: HistoryEntry[] = Array.from({ length: HISTORY_MAX_ENTRIES + 5 }, (_, index) => ({
      type: 'title',
      title: `Book ${index}`,
      viewedAt: index,
    }));

    const merged = mergeHistoryEntries(local, []);

    expect(merged).toHaveLength(HISTORY_MAX_ENTRIES);
    expect(merged[0]?.title).toBe(`Book ${HISTORY_MAX_ENTRIES + 4}`);
    expect(merged.at(-1)?.title).toBe('Book 5');
  });

  it('merges favourites by normalized ISBN and keeps newest entries first', () => {
    const merged = mergeFavourites(
      [
        { isbn: '978-626-456-009-2', title: 'Local newer', addedAt: 300 },
        { isbn: '9789865254483', title: 'Local only', addedAt: 100 },
      ],
      [
        { isbn: '9786264560092', title: 'Remote older', addedAt: 200 },
        { isbn: '9786267468296', title: 'Remote only', addedAt: 250 },
      ]
    );

    expect(merged).toEqual([
      { isbn: '9786264560092', title: 'Local newer', addedAt: 300 },
      { isbn: '9786267468296', title: 'Remote only', addedAt: 250 },
      { isbn: '9789865254483', title: 'Local only', addedAt: 100 },
    ]);
  });
});

describe('runInitialIcloudSync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(isIcloudStorageAvailable).mockReturnValue(true);
    jest.mocked(loadPreferences).mockResolvedValue(DEFAULT_PREFERENCES);
    jest.mocked(loadPreferencesUpdatedAt).mockResolvedValue(0);
    jest.mocked(loadHistory).mockResolvedValue([]);
    jest.mocked(loadFavourites).mockResolvedValue([]);
    jest.mocked(getIcloudString).mockReturnValue(null);
  });

  it('does not overwrite iCloud with empty local state before remote data arrives', async () => {
    const result = await runInitialIcloudSync();

    expect(result).toEqual({
      history: [],
      favourites: [],
      pendingRemoteData: true,
    });
    expect(setIcloudString).not.toHaveBeenCalled();
    expect(replaceHistory).not.toHaveBeenCalled();
    expect(replaceFavourites).not.toHaveBeenCalled();
  });

  it('still uploads non-empty local lists when remote data is missing', async () => {
    const localHistory: HistoryEntry[] = [{ type: 'title', title: 'Local history', viewedAt: 100 }];
    const localFavourites = [{ isbn: '9786264560092', title: 'Local favourite', addedAt: 200 }];

    jest.mocked(loadHistory).mockResolvedValue(localHistory);
    jest.mocked(loadFavourites).mockResolvedValue(localFavourites);

    const result = await runInitialIcloudSync();

    expect(result).toEqual({
      history: localHistory,
      favourites: localFavourites,
      pendingRemoteData: true,
    });
    expect(setIcloudString).toHaveBeenCalledTimes(2);
    expect(jest.mocked(setIcloudString).mock.calls).toEqual(
      expect.arrayContaining([
        [ICLOUD_HISTORY_KEY, expect.any(String)],
        [ICLOUD_FAVOURITES_KEY, expect.any(String)],
      ])
    );
  });
});
