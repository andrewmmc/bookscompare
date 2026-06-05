import assert from 'node:assert/strict';
import test from 'node:test';

import { logFetchAttempt, logParseFailure, logProviderResult } from '../src/lib/logger';

interface CapturedLine {
  level: 'log' | 'warn' | 'error';
  payload: Record<string, unknown>;
}

function captureConsole(t: { after: (fn: () => void) => void }): CapturedLine[] {
  const captured: CapturedLine[] = [];
  const original = {
    log: console.log,
    warn: console.warn,
    error: console.error,
  };

  console.log = (line: string) => captured.push({ level: 'log', payload: JSON.parse(line) });
  console.warn = (line: string) => captured.push({ level: 'warn', payload: JSON.parse(line) });
  console.error = (line: string) => captured.push({ level: 'error', payload: JSON.parse(line) });

  t.after(() => {
    console.log = original.log;
    console.warn = original.warn;
    console.error = original.error;
  });

  return captured;
}

test('logProviderResult emits an info line for ready results', (t) => {
  const captured = captureConsole(t);

  logProviderResult({ providerId: 'kingstone', status: 'ready', durationMs: 12, offerCount: 3 });

  assert.equal(captured.length, 1);
  assert.equal(captured[0]?.level, 'log');
  assert.equal(captured[0]?.payload.level, 'info');
  assert.equal(captured[0]?.payload.event, 'provider.result');
  assert.equal(captured[0]?.payload.providerId, 'kingstone');
  assert.equal(captured[0]?.payload.offerCount, 3);
  assert.ok(typeof captured[0]?.payload.timestamp === 'string');
});

test('logProviderResult emits a warn line for error results', (t) => {
  const captured = captureConsole(t);

  logProviderResult({ providerId: 'cite', status: 'error', durationMs: 5, message: 'boom' });

  assert.equal(captured[0]?.level, 'warn');
  assert.equal(captured[0]?.payload.level, 'warn');
  assert.equal(captured[0]?.payload.message, 'boom');
});

test('logFetchAttempt emits info on success and warn when an error is present', (t) => {
  const captured = captureConsole(t);

  logFetchAttempt({ url: 'https://example.com', attempt: 1, status: 200 });
  logFetchAttempt({ url: 'https://example.com', attempt: 2, error: 'timeout' });

  assert.equal(captured[0]?.level, 'log');
  assert.equal(captured[0]?.payload.level, 'info');
  assert.equal(captured[0]?.payload.event, 'fetch.attempt');
  assert.equal(captured[1]?.level, 'warn');
  assert.equal(captured[1]?.payload.level, 'warn');
  assert.equal(captured[1]?.payload.error, 'timeout');
});

test('logParseFailure always emits a warn line', (t) => {
  const captured = captureConsole(t);

  logParseFailure({
    providerId: 'eslite',
    reason: 'missing price',
    url: 'https://example.com/search?q=book',
  });

  assert.equal(captured[0]?.level, 'warn');
  assert.equal(captured[0]?.payload.event, 'provider.parse_failure');
  assert.equal(captured[0]?.payload.reason, 'missing price');
  assert.equal(captured[0]?.payload.url, 'https://example.com/search?q=book');
});
