import {
  remoteClearFavourites,
  remoteRemoveFavourite,
  remoteUpsertFavourites,
} from './favouritesSync';
import { remoteClearHistory, remoteUpsertHistory } from './historySync';
import { getActiveAccount } from './session';

import type { Favourite } from '../favourites';
import type { HistoryEntry } from '../history';

jest.mock('./session', () => ({
  getActiveAccount: jest.fn(),
}));

const mockGetActiveAccount = getActiveAccount as jest.MockedFunction<typeof getActiveAccount>;

// Minimal chainable Supabase query builder stub. `delete().eq(...).eq(...)` must
// stay chainable and resolve to `{ error }` whenever it is awaited.
function makeAccount() {
  const upsert = jest.fn().mockResolvedValue({ error: null });
  const eq = jest.fn(() => query);
  const query: { eq: jest.Mock; then: PromiseLike<{ error: null }>['then'] } = {
    eq,
    then: (onFulfilled, onRejected) =>
      Promise.resolve({ error: null as null }).then(onFulfilled, onRejected),
  };
  const del = jest.fn(() => query);
  const from = jest.fn(() => ({ upsert, delete: del }));
  const supabase = { from } as never;
  return { account: { supabase, userId: 'user-1' }, from, upsert, del, eq };
}

afterEach(() => {
  jest.clearAllMocks();
});

describe('history remote writes', () => {
  it('upserts history rows for the signed-in user', async () => {
    const { account, from, upsert } = makeAccount();
    mockGetActiveAccount.mockResolvedValue(account);

    const entries: HistoryEntry[] = [
      { type: 'isbn', isbn: '9781402894626', title: 'Book A', viewedAt: 1000 },
    ];
    await remoteUpsertHistory(entries);

    expect(from).toHaveBeenCalledWith('history_entries');
    expect(upsert).toHaveBeenCalledWith(
      [
        {
          user_id: 'user-1',
          dedupe_key: 'isbn:9781402894626',
          type: 'isbn',
          isbn: '9781402894626',
          title: 'Book A',
          viewed_at: new Date(1000).toISOString(),
        },
      ],
      { onConflict: 'user_id,dedupe_key' }
    );
  });

  it('deletes all history rows when clearing', async () => {
    const { account, from, eq } = makeAccount();
    mockGetActiveAccount.mockResolvedValue(account);

    await remoteClearHistory();

    expect(from).toHaveBeenCalledWith('history_entries');
    expect(eq).toHaveBeenCalledWith('user_id', 'user-1');
  });

  it('is a no-op when no account is active', async () => {
    mockGetActiveAccount.mockResolvedValue(null);

    await expect(remoteUpsertHistory([])).resolves.toBeUndefined();
    await expect(remoteClearHistory()).resolves.toBeUndefined();
  });
});

describe('favourites remote writes', () => {
  it('upserts favourites for the signed-in user', async () => {
    const { account, from, upsert } = makeAccount();
    mockGetActiveAccount.mockResolvedValue(account);

    const favourites: Favourite[] = [{ isbn: '9781402894626', title: 'Book A', addedAt: 2000 }];
    await remoteUpsertFavourites(favourites);

    expect(from).toHaveBeenCalledWith('favourites');
    expect(upsert).toHaveBeenCalledWith(
      [
        {
          user_id: 'user-1',
          isbn: '9781402894626',
          title: 'Book A',
          added_at: new Date(2000).toISOString(),
        },
      ],
      { onConflict: 'user_id,isbn' }
    );
  });

  it('removes a single favourite by normalized ISBN', async () => {
    const { account, from, eq } = makeAccount();
    mockGetActiveAccount.mockResolvedValue(account);

    await remoteRemoveFavourite('9781402894626');

    expect(from).toHaveBeenCalledWith('favourites');
    expect(eq).toHaveBeenCalledWith('user_id', 'user-1');
  });

  it('clears all favourites', async () => {
    const { account, eq } = makeAccount();
    mockGetActiveAccount.mockResolvedValue(account);

    await remoteClearFavourites();

    expect(eq).toHaveBeenCalledWith('user_id', 'user-1');
  });

  it('is a no-op when no account is active', async () => {
    mockGetActiveAccount.mockResolvedValue(null);

    await expect(remoteUpsertFavourites([])).resolves.toBeUndefined();
    await expect(remoteRemoveFavourite('9781402894626')).resolves.toBeUndefined();
    await expect(remoteClearFavourites()).resolves.toBeUndefined();
  });
});
