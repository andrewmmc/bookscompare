import assert from 'node:assert/strict';
import test from 'node:test';

import { fetchHtml } from '../src/lib/fetch-html';

function installFetch(t: { after: (fn: () => void) => void }, fetchImpl: typeof fetch): void {
  const originalFetch = globalThis.fetch;

  Object.defineProperty(globalThis, 'fetch', {
    value: fetchImpl,
    configurable: true,
    writable: true,
  });

  t.after(() => {
    Object.defineProperty(globalThis, 'fetch', {
      value: originalFetch,
      configurable: true,
      writable: true,
    });
  });
}

test('fetchHtml returns response text and applies a default user agent', async (t) => {
  let receivedHeaders: Headers | undefined;

  installFetch(t, async (_url, init) => {
    receivedHeaders = new Headers(init?.headers);

    return new Response('<html>ok</html>', { status: 200 });
  });

  const html = await fetchHtml('https://example.com/book', { retries: 0 });

  assert.equal(html, '<html>ok</html>');
  assert.ok(receivedHeaders?.has('user-agent'));
});

test('fetchHtml preserves a caller-provided user agent', async (t) => {
  let receivedHeaders: Headers | undefined;

  installFetch(t, async (_url, init) => {
    receivedHeaders = new Headers(init?.headers);

    return new Response('ok', { status: 200 });
  });

  await fetchHtml('https://example.com/book', {
    headers: { 'user-agent': 'BooksCompare Test Agent' },
    retries: 0,
  });

  assert.equal(receivedHeaders?.get('user-agent'), 'BooksCompare Test Agent');
});

test('fetchHtml returns null for the configured not-found status', async (t) => {
  installFetch(t, async () => new Response('missing', { status: 404 }));

  const html = await fetchHtml('https://example.com/missing', {
    notFoundStatus: 404,
    retries: 0,
  });

  assert.equal(html, null);
});

test('fetchHtml retries retryable HTTP statuses before returning text', async (t) => {
  const originalRandom = Math.random;
  let calls = 0;

  Math.random = () => 0;
  t.after(() => {
    Math.random = originalRandom;
  });

  installFetch(t, async () => {
    calls += 1;

    if (calls === 1) {
      return new Response('try again', { status: 500 });
    }

    return new Response('ok', { status: 200 });
  });

  const html = await fetchHtml('https://example.com/flaky', { retries: 1 });

  assert.equal(html, 'ok');
  assert.equal(calls, 2);
});

test('fetchHtml throws labelled timeout errors when an abort occurs', async (t) => {
  const abortError = new Error('aborted');
  abortError.name = 'AbortError';

  installFetch(t, async () => {
    throw abortError;
  });

  await assert.rejects(
    fetchHtml('https://example.com/slow', {
      errorLabel: 'Example source',
      timeoutMs: 50,
      retries: 0,
    }),
    /Example source timed out after 50ms\./
  );
});
