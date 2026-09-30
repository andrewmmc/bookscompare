import assert from 'node:assert/strict';
import test from 'node:test';

import { runProviderSearch } from '../src/services/provider-fanout';

import { createTestOffer, getBookProviders, stubProviderSearch } from './helpers';

test('runProviderSearch records disabled providers without calling search', async (t) => {
  const [provider] = getBookProviders();
  assert.ok(provider);

  const originalEnabled = provider.enabled;
  t.after(() => {
    provider.enabled = originalEnabled;
  });
  provider.enabled = false;

  stubProviderSearch(t, 'searchByIsbn', (candidate) => async () => {
    if (candidate.id === provider.id) {
      throw new Error(`${provider.id} should not be searched while disabled.`);
    }

    return [];
  });

  const result = await runProviderSearch({
    method: 'searchByIsbn',
    value: '9786267569337',
    failureMessage: 'failed',
    emptyMessage: (name) => `No ${name} results.`,
  });

  const disabled = result.sources.find((source) => source.id === provider.id);
  assert.equal(disabled?.status, 'disabled');
  assert.equal(
    disabled?.message,
    'This source does not yet have a live provider implementation.'
  );
  assert.equal(result.liveScraping, true);
});

test('runProviderSearch preserves non-Error rejection messages', async (t) => {
  stubProviderSearch(t, 'searchByIsbn', (provider) => async () => {
    if (provider.id === 'eslite') {
      throw 'eslite exploded';
    }

    return [createTestOffer(provider, { title: 'Shared title' })];
  });

  const result = await runProviderSearch({
    method: 'searchByIsbn',
    value: '9786267569337',
    failureMessage: 'One or more providers failed.',
    emptyMessage: (name) => `No ${name} results.`,
  });

  const eslite = result.sources.find((source) => source.id === 'eslite');
  assert.equal(eslite?.status, 'error');
  assert.equal(eslite?.message, 'eslite exploded');
  assert.equal(result.message, 'One or more providers failed.');
});

test('runProviderSearch adds an empty-result message for ready providers', async (t) => {
  stubProviderSearch(t, 'searchByTitle', () => async () => []);

  const result = await runProviderSearch({
    method: 'searchByTitle',
    value: '哈利波特',
    failureMessage: 'failed',
    emptyMessage: (name) => `No ${name} search results matched this title.`,
  });

  assert.equal(result.offers.length, 0);
  assert.ok(
    result.sources.every(
      (source) =>
        source.status === 'ready' &&
        source.message === `No ${source.name} search results matched this title.`
    )
  );
});
