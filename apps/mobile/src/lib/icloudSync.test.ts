import { HISTORY_MAX_ENTRIES, type HistoryEntry } from './history';
import { mergeFavourites, mergeHistoryEntries } from './icloudSync';

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
