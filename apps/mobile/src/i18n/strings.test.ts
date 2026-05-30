function loadStringsWithLocale(locale: 'zh-TW' | 'en'): typeof import('./strings') {
  jest.resetModules();
  jest.doMock('./locale', () => ({
    resolveDeviceLocale: () => locale,
  }));

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('./strings') as typeof import('./strings');
}

describe('strings', () => {
  afterEach(() => {
    jest.dontMock('./locale');
    jest.resetModules();
  });

  it('exports Traditional Chinese strings when zh-TW is resolved', () => {
    const { activeLocale, strings } = loadStringsWithLocale('zh-TW');

    expect(activeLocale).toBe('zh-TW');
    expect(strings.app.brand).toBe('好書價 BooksCompare');
  });

  it('exports English strings when en is resolved', () => {
    const { activeLocale, strings } = loadStringsWithLocale('en');

    expect(activeLocale).toBe('en');
    expect(strings.app.brand).toBe('BooksCompare');
  });
});
