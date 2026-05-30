import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildMeta,
  createBookDetailResponse,
  createDisabledSourceState,
  createErrorResponse,
  createSearchResponse,
} from '../src/lib/responses';

import type { BookDetail, SourceState } from '@bookscompare/contracts';

const sources: SourceState[] = [{ id: 'books-com-tw', name: '博客來', status: 'ready' }];
const book: BookDetail = {
  id: '9786264560092',
  title: '別送(新版)',
  authors: ['鍾文音'],
  publisher: '麥田',
  summary: 'summary',
  imageUrl: 'https://example.com/book.jpg',
  offers: [
    {
      sourceId: 'books-com-tw',
      sourceName: '博客來',
      sourceProductId: '0011049950',
      title: '別送(新版)',
      productType: '中文書',
      authors: ['鍾文音'],
      publisher: '麥田',
      publicationDate: '2026-04-30',
      summary: 'summary',
      price: 537,
      currency: 'TWD',
      priceText: '537 元',
      url: 'https://example.com/book',
      imageUrl: 'https://example.com/book.jpg',
      badges: [],
    },
  ],
};

test('response helpers include optional metadata only when provided', () => {
  assert.deepEqual(buildMeta({ liveScraping: true, requestedAt: '2026-05-30T00:00:00.000Z' }), {
    liveScraping: true,
    requestedAt: '2026-05-30T00:00:00.000Z',
  });

  assert.equal(buildMeta({ liveScraping: false, message: 'partial' }).message, 'partial');
});

test('createSearchResponse and createBookDetailResponse preserve payloads', () => {
  const search = createSearchResponse({
    query: { title: '別送' },
    books: [book],
    sources,
    liveScraping: true,
    message: 'ok',
  });

  assert.deepEqual(search.query, { title: '別送' });
  assert.deepEqual(search.books, [book]);
  assert.deepEqual(search.sources, sources);
  assert.equal(search.meta.liveScraping, true);
  assert.equal(search.meta.message, 'ok');

  const detail = createBookDetailResponse({
    query: { isbn: '9786264560092' },
    book,
    sources,
    liveScraping: true,
    message: 'ok',
  });

  assert.deepEqual(detail.query, { isbn: '9786264560092' });
  assert.deepEqual(detail.book, book);
  assert.deepEqual(detail.sources, sources);
  assert.equal(detail.meta.message, 'ok');
});

test('createDisabledSourceState and createErrorResponse build contract payloads', () => {
  assert.deepEqual(createDisabledSourceState('books-com-tw'), {
    id: 'books-com-tw',
    name: '博客來',
    status: 'disabled',
    message: 'This source does not yet have a live provider implementation.',
  });

  assert.throws(
    () => createDisabledSourceState('unknown' as Parameters<typeof createDisabledSourceState>[0]),
    /Unknown source id: unknown/
  );

  assert.deepEqual(createErrorResponse('NOT_FOUND', 'Missing.'), {
    error: { code: 'NOT_FOUND', message: 'Missing.' },
  });
});
