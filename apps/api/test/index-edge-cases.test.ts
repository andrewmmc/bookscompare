import assert from 'node:assert/strict';
import test from 'node:test';

import worker from '../src/index';

function createExecutionContext(): ExecutionContext {
  return {
    waitUntil() {},
    passThroughOnException() {},
  } as unknown as ExecutionContext;
}

const env = {} as Record<string, never>;

test('worker returns service metadata for root and health routes', async () => {
  const root = await worker.fetch(
    new Request('https://bookscompare-api.andrewmmc.workers.dev/'),
    env,
    createExecutionContext()
  );
  const rootBody = (await root.json()) as { ok: boolean; service: string; message: string };

  assert.equal(root.status, 200);
  assert.equal(root.headers.get('cache-control'), 'no-store');
  assert.equal(rootBody.ok, true);
  assert.equal(rootBody.service, 'bookscompare-api');
  assert.match(rootBody.message, /Use \/isbn\/:id/);

  const health = await worker.fetch(
    new Request('https://bookscompare-api.andrewmmc.workers.dev/health'),
    env,
    createExecutionContext()
  );
  const healthBody = (await health.json()) as { ok: boolean; service: string };

  assert.equal(health.status, 200);
  assert.deepEqual(healthBody, { ok: true, service: 'bookscompare-api' });
});

test('worker returns JSON errors for unsupported methods, routes, and invalid ISBNs', async () => {
  const method = await worker.fetch(
    new Request('https://bookscompare-api.andrewmmc.workers.dev/health', { method: 'POST' }),
    env,
    createExecutionContext()
  );
  const methodBody = (await method.json()) as { error: { code: string; message: string } };

  assert.equal(method.status, 405);
  assert.equal(method.headers.get('content-type'), 'application/json; charset=utf-8');
  assert.deepEqual(methodBody.error, {
    code: 'METHOD_NOT_ALLOWED',
    message: 'Only GET requests are supported.',
  });

  const notFound = await worker.fetch(
    new Request('https://bookscompare-api.andrewmmc.workers.dev/nope'),
    env,
    createExecutionContext()
  );
  const notFoundBody = (await notFound.json()) as { error: { code: string; message: string } };

  assert.equal(notFound.status, 404);
  assert.equal(notFoundBody.error.code, 'NOT_FOUND');
  assert.equal(notFoundBody.error.message, 'No route matches /nope.');

  const invalidIsbn = await worker.fetch(
    new Request('https://bookscompare-api.andrewmmc.workers.dev/isbn/not-an-isbn'),
    env,
    createExecutionContext()
  );
  const invalidIsbnBody = (await invalidIsbn.json()) as { error: { code: string } };

  assert.equal(invalidIsbn.status, 400);
  assert.equal(invalidIsbn.headers.get('x-bookscompare-cache'), 'MISS');
  assert.equal(invalidIsbnBody.error.code, 'INVALID_ISBN');
});

test('worker validates maximum free-text query lengths before cache lookup', async () => {
  const longQuery = 'x'.repeat(101);

  const search = await worker.fetch(
    new Request(`https://bookscompare-api.andrewmmc.workers.dev/search?q=${longQuery}`),
    env,
    createExecutionContext()
  );
  const searchBody = (await search.json()) as { error: { code: string; message: string } };

  assert.equal(search.status, 400);
  assert.equal(search.headers.get('x-bookscompare-cache'), 'MISS');
  assert.deepEqual(searchBody.error, {
    code: 'INVALID_QUERY',
    message: 'Search query must be 100 characters or fewer.',
  });

  const longTitle = await worker.fetch(
    new Request(`https://bookscompare-api.andrewmmc.workers.dev/book/by-title?title=${longQuery}`),
    env,
    createExecutionContext()
  );
  const longTitleBody = (await longTitle.json()) as { error: { code: string; message: string } };

  assert.equal(longTitle.status, 400);
  assert.deepEqual(longTitleBody.error, {
    code: 'INVALID_QUERY',
    message: 'Title must be 100 characters or fewer.',
  });

  const longAuthor = await worker.fetch(
    new Request(
      `https://bookscompare-api.andrewmmc.workers.dev/book/by-title?title=ok&author=${longQuery}`
    ),
    env,
    createExecutionContext()
  );
  const longAuthorBody = (await longAuthor.json()) as { error: { code: string; message: string } };

  assert.equal(longAuthor.status, 400);
  assert.deepEqual(longAuthorBody.error, {
    code: 'INVALID_QUERY',
    message: 'Author must be 100 characters or fewer.',
  });
});
