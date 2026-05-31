import assert from 'node:assert/strict';
import test from 'node:test';

import { isValidIsbn, normalizeIsbn } from '@bookscompare/contracts';

test('normalizeIsbn strips separators and uppercases', () => {
  assert.equal(normalizeIsbn(' 978-1-4028-9462-6 '), '9781402894626');
  assert.equal(normalizeIsbn('123456789x'), '123456789X');
});

test('isValidIsbn accepts valid ISBN-13 and ISBN-10 values', () => {
  assert.equal(isValidIsbn('9781402894626'), true);
  assert.equal(isValidIsbn('978-1-4028-9462-6'), true);
  assert.equal(isValidIsbn('123456789X'), true);
  assert.equal(isValidIsbn('0306406152'), true);
});

test('isValidIsbn rejects malformed values', () => {
  assert.equal(isValidIsbn('1234'), false);
  assert.equal(isValidIsbn(''), false);
  assert.equal(isValidIsbn('978140289462X'), false);
});

test('isValidIsbn rejects values with an invalid check digit', () => {
  assert.equal(isValidIsbn('9781402894627'), false);
  assert.equal(isValidIsbn('1234567890'), false);
});
