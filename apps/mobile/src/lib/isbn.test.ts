import { isValidIsbn, normalizeIsbn } from './isbn';

describe('isbn helpers', () => {
  it('normalizes separators and casing', () => {
    expect(normalizeIsbn(' 978-1-4028-9462-6 ')).toBe('9781402894626');
    expect(normalizeIsbn('123456789x')).toBe('123456789X');
  });

  it('accepts isbn-10 and isbn-13 shapes', () => {
    expect(isValidIsbn('9781402894626')).toBe(true);
    expect(isValidIsbn('123456789X')).toBe(true);
    expect(isValidIsbn('1234')).toBe(false);
  });
});
