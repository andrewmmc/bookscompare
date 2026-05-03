import assert from 'node:assert/strict';
import test from 'node:test';

import type { BookOffer, BookSourceId } from '@bookscompare/contracts';

import {
  buildTitleAuthorClusterKey,
  clusterOffersIntoBooks,
  clusterToBookDetail,
  clusterToBookSummary,
  findClusterByTitleAuthor,
  normalizeForClusterKey,
} from '../src/lib/cluster';

interface OfferOverrides {
  sourceId?: BookSourceId;
  sourceProductId?: string;
  isbn?: string;
  title?: string;
  authors?: string[];
  publisher?: string;
  publicationDate?: string;
  summary?: string;
  price?: number;
  imageUrl?: string;
}

function createOffer(overrides: OfferOverrides = {}): BookOffer {
  const sourceId: BookSourceId = overrides.sourceId ?? 'books-com-tw';

  return {
    sourceId,
    sourceName: sourceId,
    sourceProductId: overrides.sourceProductId ?? `${sourceId}-1`,
    ...(overrides.isbn ? { isbn: overrides.isbn } : {}),
    title: overrides.title ?? '原子習慣',
    productType: '中文書',
    authors: overrides.authors ?? ['James Clear'],
    publisher: overrides.publisher ?? '方智',
    ...(overrides.publicationDate ? { publicationDate: overrides.publicationDate } : {}),
    summary: overrides.summary ?? '',
    price: overrides.price ?? 300,
    currency: 'TWD',
    priceText: `${overrides.price ?? 300} 元`,
    url: `https://example.com/${sourceId}/${overrides.sourceProductId ?? '1'}`,
    imageUrl: overrides.imageUrl ?? `https://example.com/${sourceId}.jpg`,
    badges: [],
  };
}

test('normalizeForClusterKey lowercases, collapses whitespace, and strips punctuation', () => {
  assert.equal(normalizeForClusterKey('Atomic  Habits'), 'atomic habits');
  assert.equal(normalizeForClusterKey('  原子習慣\u3000'), '原子習慣');
  assert.equal(normalizeForClusterKey('Atomic Habits: Tiny Changes'), 'atomic habits tiny changes');
  assert.equal(normalizeForClusterKey('原子習慣（修訂版）'), '原子習慣 修訂版');
  assert.equal(normalizeForClusterKey('原子習慣【全新版】'), '原子習慣 全新版');
  assert.equal(normalizeForClusterKey(''), '');
});

test('buildTitleAuthorClusterKey joins normalized title and author with a pipe', () => {
  assert.equal(buildTitleAuthorClusterKey('原子習慣', 'James Clear'), '原子習慣|james clear');
  assert.equal(buildTitleAuthorClusterKey('原子習慣'), '原子習慣|');
  // Two inputs that differ only by whitespace and case map to the same key.
  assert.equal(
    buildTitleAuthorClusterKey('Atomic Habits', 'James Clear'),
    buildTitleAuthorClusterKey('atomic  habits', 'JAMES CLEAR')
  );
});

test('clusterOffersIntoBooks groups offers sharing the same ISBN into one cluster', () => {
  const offers = [
    createOffer({ sourceId: 'books-com-tw', isbn: '9789861374482', price: 320 }),
    createOffer({ sourceId: 'kingstone', isbn: '9789861374482', price: 280 }),
  ];

  const clusters = clusterOffersIntoBooks(offers);

  assert.equal(clusters.length, 1);
  assert.equal(clusters[0]?.isbn, '9789861374482');
  assert.equal(clusters[0]?.offers.length, 2);
});

test('clusterOffersIntoBooks groups offers without ISBN by normalized title and first author', () => {
  const offers = [
    createOffer({ sourceId: 'books-com-tw', title: '原子習慣', authors: ['James Clear'] }),
    createOffer({ sourceId: 'eslite', title: '原子習慣  ', authors: ['JAMES CLEAR'] }),
  ];

  const clusters = clusterOffersIntoBooks(offers);

  assert.equal(clusters.length, 1);
  assert.equal(clusters[0]?.isbn, undefined);
  assert.equal(clusters[0]?.offers.length, 2);
});

test('clusterOffersIntoBooks separates books with different titles or different first authors', () => {
  const offers = [
    createOffer({ sourceId: 'books-com-tw', title: '原子習慣', authors: ['James Clear'] }),
    createOffer({ sourceId: 'eslite', title: '深度工作力', authors: ['Cal Newport'] }),
    createOffer({ sourceId: 'kingstone', title: '原子習慣', authors: ['不同作者'] }),
  ];

  const clusters = clusterOffersIntoBooks(offers);

  assert.equal(clusters.length, 3);
});

test('clusterOffersIntoBooks ignores invalid ISBNs and falls back to title clustering', () => {
  const offers = [
    createOffer({ sourceId: 'books-com-tw', isbn: 'not-an-isbn', title: '原子習慣' }),
    createOffer({ sourceId: 'kingstone', title: '原子習慣' }),
  ];

  const clusters = clusterOffersIntoBooks(offers);

  assert.equal(clusters.length, 1);
  assert.equal(clusters[0]?.isbn, undefined);
  assert.equal(clusters[0]?.offers.length, 2);
});

test('clusterOffersIntoBooks normalizes hyphenated ISBNs', () => {
  const offers = [
    createOffer({ sourceId: 'books-com-tw', isbn: '978-986-137-448-2' }),
    createOffer({ sourceId: 'kingstone', isbn: '9789861374482' }),
  ];

  const clusters = clusterOffersIntoBooks(offers);

  assert.equal(clusters.length, 1);
  assert.equal(clusters[0]?.isbn, '9789861374482');
});

test('clusterToBookSummary picks lowest price, sums offers, and uses ISBN as id when available', () => {
  const cluster = clusterOffersIntoBooks([
    createOffer({ sourceId: 'books-com-tw', isbn: '9789861374482', price: 320 }),
    createOffer({ sourceId: 'kingstone', isbn: '9789861374482', price: 280 }),
    createOffer({ sourceId: 'eslite', isbn: '9789861374482', price: 300 }),
  ])[0];

  assert.ok(cluster);
  const summary = clusterToBookSummary(cluster);

  assert.equal(summary.id, '9789861374482');
  assert.equal(summary.isbn, '9789861374482');
  assert.equal(summary.lowestPrice, 280);
  assert.equal(summary.offerCount, 3);
  assert.equal(summary.currency, 'TWD');
});

test('clusterToBookSummary falls back to a t- prefixed id when the cluster has no ISBN', () => {
  const cluster = clusterOffersIntoBooks([
    createOffer({ title: '原子習慣', authors: ['James Clear'] }),
  ])[0];

  assert.ok(cluster);
  const summary = clusterToBookSummary(cluster);

  assert.ok(summary.id.startsWith('t-'));
  assert.equal(summary.isbn, undefined);
});

test('clusterToBookDetail sorts offers by price ascending and prefers the longest summary as primary', () => {
  const cluster = clusterOffersIntoBooks([
    createOffer({
      sourceId: 'books-com-tw',
      isbn: '9789861374482',
      price: 320,
      summary: 'short summary',
    }),
    createOffer({
      sourceId: 'kingstone',
      isbn: '9789861374482',
      price: 250,
      summary: 'this is a much longer summary that should be picked as the primary description',
    }),
    createOffer({
      sourceId: 'eslite',
      isbn: '9789861374482',
      price: 290,
      summary: '',
    }),
  ])[0];

  assert.ok(cluster);
  const detail = clusterToBookDetail(cluster);

  assert.deepEqual(
    detail.offers.map((offer) => offer.price),
    [250, 290, 320]
  );
  assert.equal(
    detail.summary,
    'this is a much longer summary that should be picked as the primary description'
  );
});

test('findClusterByTitleAuthor matches the cluster with the same normalized title and author', () => {
  const clusters = clusterOffersIntoBooks([
    createOffer({ title: '原子習慣', authors: ['James Clear'] }),
    createOffer({ title: '深度工作力', authors: ['Cal Newport'] }),
  ]);

  const match = findClusterByTitleAuthor(clusters, 'Atomic Habits', 'James Clear');
  // Different normalized title -> no match.
  assert.equal(match, undefined);

  const exact = findClusterByTitleAuthor(clusters, '原子習慣', 'JAMES  CLEAR');
  assert.ok(exact);
  assert.equal(exact?.offers[0]?.title, '原子習慣');
});

test('findClusterByTitleAuthor falls back to title-only matching when no author is provided', () => {
  const clusters = clusterOffersIntoBooks([
    createOffer({ title: '原子習慣', authors: ['James Clear'] }),
  ]);

  const match = findClusterByTitleAuthor(clusters, '原子習慣');
  assert.ok(match);
  assert.equal(match?.offers[0]?.authors[0], 'James Clear');
});

test('findClusterByTitleAuthor returns undefined when nothing matches', () => {
  const clusters = clusterOffersIntoBooks([
    createOffer({ title: '原子習慣', authors: ['James Clear'] }),
  ]);

  assert.equal(findClusterByTitleAuthor(clusters, 'Some Other Book', 'Other Author'), undefined);
});
