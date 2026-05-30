import assert from 'node:assert/strict';
import test from 'node:test';

import { BOOK_SOURCES } from '@bookscompare/contracts';

import { providers } from '../src/providers/registry';

test('registry exposes one provider per BOOK_SOURCES entry in declared order', () => {
  assert.equal(providers.length, BOOK_SOURCES.length);

  assert.deepEqual(
    providers.map((provider) => provider.id),
    BOOK_SOURCES.map((source) => source.id)
  );

  assert.deepEqual(
    providers.map((provider) => provider.name),
    BOOK_SOURCES.map((source) => source.name)
  );
});

test('every BOOK_SOURCES id is backed by an enabled provider implementation', () => {
  for (const source of BOOK_SOURCES) {
    const provider = providers.find((candidate) => candidate.id === source.id);

    assert.ok(provider, `missing provider for source ${source.id}`);
    assert.equal(provider?.enabled, true, `provider ${source.id} should be enabled`);
  }
});
