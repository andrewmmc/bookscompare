import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { isProbeProviderId, probeProvider, PROBE_PROVIDER_IDS } from '../src/spikes/provider-probe';

async function readFixture(path: string): Promise<string> {
  return readFile(new URL(`./fixtures/${path}`, import.meta.url), 'utf8');
}

test('the generic probe exposes production providers and experimental Kobo', () => {
  assert.deepEqual(PROBE_PROVIDER_IDS, ['books-com-tw', 'kingstone', 'cite', 'eslite', 'kobo-tw']);
  assert.equal(isProbeProviderId('eslite'), true);
  assert.equal(isProbeProviderId('unknown'), false);
});

test('the generic probe reports offers from a production source adapter', async (t) => {
  const payload = await readFixture('eslite/found.json');
  const originalFetch = globalThis.fetch;

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = (async () => Response.json(JSON.parse(payload) as unknown)) as typeof fetch;

  const result = await probeProvider('eslite', '9786264560092');

  assert.equal(result.ok, true);
  assert.equal(result.offerCount, 1);
  assert.equal(result.offers[0]?.sourceProductId, '2683129498002');
  assert.equal(result.error, undefined);
});

test('the generic probe reports Kobo challenge diagnostics', async (t) => {
  const html = await readFixture('kobo-tw/challenge.html');
  const originalFetch = globalThis.fetch;

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = (async () => new Response(html, { status: 403 })) as typeof fetch;

  const result = await probeProvider('kobo-tw', '9786267492987');

  assert.equal(result.ok, false);
  assert.equal(result.offerCount, 0);
  assert.equal(result.transport?.status, 403);
  assert.equal(result.transport?.challenged, true);
  assert.match(result.error ?? '', /Kobo returned 403/);
});
