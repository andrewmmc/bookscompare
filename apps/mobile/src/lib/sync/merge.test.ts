import { mergeFavourites } from './favouritesSync';
import { mergeHistory } from './historySync';

import { HISTORY_MAX_ENTRIES, type HistoryEntry } from '../history';

import type { Favourite } from '../favourites';

describe('mergeHistory', () => {
  it('de-dupes by key keeping the most recently viewed copy', () => {
    const local: HistoryEntry[] = [{ type: 'isbn', isbn: '9781402894626', viewedAt: 1000 }];
    const remote: HistoryEntry[] = [
      { type: 'isbn', isbn: '9781402894626', title: 'Book A', viewedAt: 3000 },
    ];

    expect(mergeHistory(local, remote)).toEqual([
      { type: 'isbn', isbn: '9781402894626', title: 'Book A', viewedAt: 3000 },
    ]);
  });

  it('preserves a known title even when the newest copy lacks one', () => {
    const local: HistoryEntry[] = [
      { type: 'isbn', isbn: '9781402894626', title: 'Book A', viewedAt: 1000 },
    ];
    const remote: HistoryEntry[] = [{ type: 'isbn', isbn: '9781402894626', viewedAt: 3000 }];

    expect(mergeHistory(local, remote)).toEqual([
      { type: 'isbn', isbn: '9781402894626', title: 'Book A', viewedAt: 3000 },
    ]);
  });

  it('combines distinct entries newest-first', () => {
    const local: HistoryEntry[] = [{ type: 'title', title: '哈利波特', viewedAt: 2000 }];
    const remote: HistoryEntry[] = [{ type: 'isbn', isbn: '9781402894626', viewedAt: 5000 }];

    expect(mergeHistory(local, remote)).toEqual([
      { type: 'isbn', isbn: '9781402894626', viewedAt: 5000 },
      { type: 'title', title: '哈利波特', viewedAt: 2000 },
    ]);
  });

  it('caps the merged result at HISTORY_MAX_ENTRIES', () => {
    const local: HistoryEntry[] = Array.from({ length: HISTORY_MAX_ENTRIES }, (_, i) => ({
      type: 'title' as const,
      title: `local-${i}`,
      viewedAt: 1000 + i,
    }));
    const remote: HistoryEntry[] = Array.from({ length: HISTORY_MAX_ENTRIES }, (_, i) => ({
      type: 'title' as const,
      title: `remote-${i}`,
      viewedAt: 5000 + i,
    }));

    const merged = mergeHistory(local, remote);
    expect(merged).toHaveLength(HISTORY_MAX_ENTRIES);
    // Highest viewedAt wins, so all survivors are from the remote batch.
    expect(
      merged.every((entry) => entry.type === 'title' && entry.title.startsWith('remote-'))
    ).toBe(true);
  });
});

describe('mergeFavourites', () => {
  it('de-dupes by ISBN keeping the most recently added copy', () => {
    const local: Favourite[] = [{ isbn: '9781402894626', title: 'Old', addedAt: 1000 }];
    const remote: Favourite[] = [{ isbn: '9781402894626', title: 'New', addedAt: 3000 }];

    expect(mergeFavourites(local, remote)).toEqual([
      { isbn: '9781402894626', title: 'New', addedAt: 3000 },
    ]);
  });

  it('combines distinct favourites newest-first', () => {
    const local: Favourite[] = [{ isbn: '1111111111', title: 'A', addedAt: 1000 }];
    const remote: Favourite[] = [{ isbn: '2222222222', title: 'B', addedAt: 4000 }];

    expect(mergeFavourites(local, remote)).toEqual([
      { isbn: '2222222222', title: 'B', addedAt: 4000 },
      { isbn: '1111111111', title: 'A', addedAt: 1000 },
    ]);
  });
});
