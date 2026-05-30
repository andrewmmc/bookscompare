import { dictionaries } from './dictionaries';

describe('dictionaries', () => {
  it('provides Traditional Chinese formatter strings', () => {
    const zhTW = dictionaries['zh-TW'];

    expect(zhTW.app.brand).toBe('好書價 BooksCompare');
    expect(zhTW.history.viewedOn('2026/05/30')).toBe('2026/05/30 查看');
    expect(zhTW.history.isbnLabel('9786264560092')).toBe('ISBN 9786264560092');
    expect(zhTW.searchResult.resultsCount(2)).toBe('共找到 2 個結果。');
    expect(zhTW.searchResult.fromPrice('NT$537')).toBe('NT$537 起');
    expect(zhTW.searchResult.storeCount(3)).toBe('3 家書店');
    expect(zhTW.priceTag.discountTag(79)).toBe('79折');
    expect(zhTW.favourites.addedOn('2026/05/30')).toBe('2026/05/30 加入收藏');
    expect(zhTW.about.version('2.7.2', '42')).toBe('版本 v2.7.2 (42)');
    expect(zhTW.about.version('2.7.2', '')).toBe('版本 v2.7.2');
    expect(zhTW.storePreferences.settingsRowValue(2)).toBe('已選 2 家');
  });

  it('provides English formatter strings with singular and plural variants', () => {
    const en = dictionaries.en;

    expect(en.app.brand).toBe('BooksCompare');
    expect(en.history.viewedOn('May 30, 2026')).toBe('Viewed on May 30, 2026');
    expect(en.history.isbnLabel('9786264560092')).toBe('ISBN 9786264560092');
    expect(en.searchResult.resultsCount(1)).toBe('Found 1 result.');
    expect(en.searchResult.resultsCount(2)).toBe('Found 2 results.');
    expect(en.searchResult.fromPrice('NT$537')).toBe('from NT$537');
    expect(en.searchResult.storeCount(1)).toBe('1 store');
    expect(en.searchResult.storeCount(3)).toBe('3 stores');
    expect(en.priceTag.discountTag(79)).toBe('79% list');
    expect(en.favourites.addedOn('May 30, 2026')).toBe('Added on May 30, 2026');
    expect(en.about.version('2.7.2', '42')).toBe('Version v2.7.2 (42)');
    expect(en.about.version('2.7.2', '')).toBe('Version v2.7.2');
    expect(en.storePreferences.settingsRowValue(2)).toBe('2 selected');
  });
});
