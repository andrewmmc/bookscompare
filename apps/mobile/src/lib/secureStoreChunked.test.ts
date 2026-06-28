import { chunkedSecureStoreAdapter } from './secureStoreChunked';

import * as SecureStore from 'expo-secure-store';

jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    __store: store,
    getItemAsync: jest.fn(async (key: string) => (store.has(key) ? store.get(key)! : null)),
    setItemAsync: jest.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
    deleteItemAsync: jest.fn(async (key: string) => {
      store.delete(key);
    }),
  };
});

const store = (SecureStore as unknown as { __store: Map<string, string> }).__store;

describe('chunkedSecureStoreAdapter', () => {
  beforeEach(() => {
    store.clear();
    jest.clearAllMocks();
  });

  it('round-trips a small value', async () => {
    await chunkedSecureStoreAdapter.setItem('sb-token', 'hello');
    await expect(chunkedSecureStoreAdapter.getItem('sb-token')).resolves.toBe('hello');
  });

  it('round-trips a value larger than the 2KB SecureStore cap', async () => {
    const big = 'x'.repeat(5000);
    await chunkedSecureStoreAdapter.setItem('sb-token', big);

    // Should be split across multiple chunk keys, none over the cap.
    expect(store.get('sb-token')).toBe('3');
    expect(store.has('sb-token.0')).toBe(true);
    expect(store.has('sb-token.2')).toBe(true);
    for (const [key, value] of store) {
      if (key !== 'sb-token') {
        expect(value.length).toBeLessThanOrEqual(1800);
      }
    }

    await expect(chunkedSecureStoreAdapter.getItem('sb-token')).resolves.toBe(big);
  });

  it('clears stale chunks when overwriting with a shorter value', async () => {
    await chunkedSecureStoreAdapter.setItem('sb-token', 'y'.repeat(5000));
    await chunkedSecureStoreAdapter.setItem('sb-token', 'short');

    expect(store.has('sb-token.1')).toBe(false);
    expect(store.has('sb-token.2')).toBe(false);
    await expect(chunkedSecureStoreAdapter.getItem('sb-token')).resolves.toBe('short');
  });

  it('removes all chunks on removeItem', async () => {
    await chunkedSecureStoreAdapter.setItem('sb-token', 'z'.repeat(5000));
    await chunkedSecureStoreAdapter.removeItem('sb-token');

    expect(store.size).toBe(0);
    await expect(chunkedSecureStoreAdapter.getItem('sb-token')).resolves.toBeNull();
  });

  it('returns null for a missing key', async () => {
    await expect(chunkedSecureStoreAdapter.getItem('absent')).resolves.toBeNull();
  });

  it('reads a legacy raw (non-chunked) value', async () => {
    store.set('sb-token', 'legacy-session-string');
    await expect(chunkedSecureStoreAdapter.getItem('sb-token')).resolves.toBe(
      'legacy-session-string'
    );
  });

  it('returns null when a chunk is missing (corrupt write)', async () => {
    await chunkedSecureStoreAdapter.setItem('sb-token', 'a'.repeat(5000));
    store.delete('sb-token.1');
    await expect(chunkedSecureStoreAdapter.getItem('sb-token')).resolves.toBeNull();
  });
});
