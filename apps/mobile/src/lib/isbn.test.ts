import { isValidIsbn, normalizeIsbn } from '@bookscompare/contracts';

describe('isbn helpers', () => {
  it('normalizes separators and casing', () => {
    expect(normalizeIsbn(' 978-1-4028-9462-6 ')).toBe('9781402894626');
    expect(normalizeIsbn('123456789x')).toBe('123456789X');
  });

  it('accepts valid isbn-10 and isbn-13 values', () => {
    expect(isValidIsbn('9781402894626')).toBe(true);
    expect(isValidIsbn('978-1-4028-9462-6')).toBe(true);
    expect(isValidIsbn('123456789X')).toBe(true);
    expect(isValidIsbn('0306406152')).toBe(true);
  });

  it('rejects malformed values', () => {
    expect(isValidIsbn('1234')).toBe(false);
    expect(isValidIsbn('')).toBe(false);
    expect(isValidIsbn('978140289462X')).toBe(false);
  });

  it('rejects values with an invalid check digit', () => {
    expect(isValidIsbn('9781402894627')).toBe(false);
    expect(isValidIsbn('1234567890')).toBe(false);
  });
});
