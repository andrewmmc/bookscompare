import assert from 'node:assert/strict';
import test from 'node:test';

import { fetchWithTimeout } from '../src/lib/fetch-with-timeout';

function installFetch(t: { after: (fn: () => void) => void }, fetchImpl: typeof fetch): void {
  const originalFetch = globalThis.fetch;
  Object.defineProperty(globalThis, 'fetch', { value: fetchImpl, configurable: true });
  t.after(() => Object.defineProperty(globalThis, 'fetch', { value: originalFetch }));
}

test('fetchWithTimeout preserves caller cancellation', async (t) => {
  installFetch(
    t,
    async (_url, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(init.signal?.reason), { once: true });
      })
  );
  const controller = new AbortController();
  const reason = new Error('caller cancelled');
  const request = fetchWithTimeout('https://example.com', { signal: controller.signal }, 1000);
  controller.abort(reason);
  await assert.rejects(request, reason);
});

test('fetchWithTimeout aborts with a distinct timeout reason', async (t) => {
  installFetch(
    t,
    async (_url, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(init.signal?.reason), { once: true });
      })
  );
  await assert.rejects(fetchWithTimeout('https://example.com', {}, 1), (error: unknown) => {
    assert.equal((error as Error).name, 'TimeoutError');
    return true;
  });
});
