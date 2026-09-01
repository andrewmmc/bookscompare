import { namespaces, resources } from './resources';
import { i18n } from './index';

function leafKeys(value: unknown, prefix = ''): string[] {
  if (!value || typeof value !== 'object') {
    return [prefix];
  }

  return Object.entries(value).flatMap(([key, child]) =>
    leafKeys(child, prefix ? `${prefix}.${key}` : key)
  );
}

describe('translation resources', () => {
  it.each(namespaces)('keeps en and zh-TW keys aligned in %s', (namespace) => {
    expect(leafKeys(resources.en[namespace]).sort()).toEqual(
      leafKeys(resources['zh-TW'][namespace]).sort()
    );
  });

  it('supports interpolation and English plurals', async () => {
    await i18n.changeLanguage('en');
    expect(i18n.t('searchResult.resultsCount', { ns: 'search', count: 1 })).toBe('Found 1 result.');
    expect(i18n.t('searchResult.resultsCount', { ns: 'search', count: 2 })).toBe(
      'Found 2 results.'
    );
  });
});
