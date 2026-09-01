type LocaleEntry = {
  languageTag?: string | null;
  languageCode?: string | null;
};

function loadLocaleWithLocales(localesOrError: LocaleEntry[] | Error): typeof import('./locale') {
  jest.resetModules();
  jest.doMock('expo-localization', () => ({
    getLocales: () => {
      if (localesOrError instanceof Error) {
        throw localesOrError;
      }

      return localesOrError;
    },
  }));

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('./locale') as typeof import('./locale');
}

describe('resolveDeviceLocale', () => {
  afterEach(() => {
    jest.dontMock('expo-localization');
    jest.resetModules();
  });

  it('resolves supported Chinese locale tags', () => {
    const { resolveDeviceLocale } = loadLocaleWithLocales([{ languageTag: 'zh-Hant-TW' }]);

    expect(resolveDeviceLocale()).toBe('zh-TW');
  });

  it('falls back to languageCode when languageTag is missing', () => {
    const { resolveDeviceLocale } = loadLocaleWithLocales([
      { languageTag: null, languageCode: 'zh' },
    ]);

    expect(resolveDeviceLocale()).toBe('zh-TW');
  });

  it('resolves supported English locale tags', () => {
    const { resolveDeviceLocale } = loadLocaleWithLocales([{ languageTag: 'en-US' }]);

    expect(resolveDeviceLocale()).toBe('en');
  });

  it('uses an explicit preference before the device locale', () => {
    const { resolveLocale } = loadLocaleWithLocales([{ languageTag: 'en-US' }]);

    expect(resolveLocale('zh-TW', [{ languageTag: 'en-US', languageCode: 'en' }])).toBe('zh-TW');
  });

  it('falls back to default when localization throws or has no match', () => {
    const throwing = loadLocaleWithLocales(new Error('native module missing'));
    expect(throwing.resolveDeviceLocale()).toBe(throwing.DEFAULT_LOCALE);

    const unmatched = loadLocaleWithLocales([{ languageTag: 'ja-JP', languageCode: 'ja' }]);
    expect(unmatched.resolveDeviceLocale()).toBe(unmatched.DEFAULT_LOCALE);
  });
});
