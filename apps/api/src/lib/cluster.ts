import type { BookOffer, BookDetail, BookSummary } from '@bookscompare/contracts';

import { isValidIsbn, normalizeIsbn } from './isbn';

/**
 * Normalize a string for cluster-key comparison. Lower-cases, collapses
 * whitespace, strips simple punctuation/brackets. Keeps CJK characters as-is.
 */
export function normalizeForClusterKey(input: string): string {
  return input
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s\u3000]+/g, ' ')
    .replace(/[()[\]【】（）「」『』:：,，.。!！?？\-—_/\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Build a stable cluster key for an offer from its title + first author.
 * Used both during cluster building and when looking up a book by title/author.
 */
export function buildTitleAuthorClusterKey(title: string, author?: string): string {
  const normalizedTitle = normalizeForClusterKey(title);
  const normalizedAuthor = author ? normalizeForClusterKey(author) : '';

  return `${normalizedTitle}|${normalizedAuthor}`;
}

interface OfferCluster {
  key: string;
  isbn?: string;
  offers: BookOffer[];
}

function pickIsbnFromOffer(offer: BookOffer): string | undefined {
  if (!offer.isbn) {
    return undefined;
  }

  const normalized = normalizeIsbn(offer.isbn);

  return isValidIsbn(normalized) ? normalized : undefined;
}

function clusterKeyForOffer(offer: BookOffer): string {
  const isbn = pickIsbnFromOffer(offer);

  if (isbn) {
    return `isbn:${isbn}`;
  }

  return `t:${buildTitleAuthorClusterKey(offer.title, offer.authors[0])}`;
}

/**
 * Group offers from across providers into book clusters.
 *
 * Clustering rule:
 *   1. If two offers share the same valid ISBN, they are the same book.
 *   2. Otherwise, offers with the same normalized (title, firstAuthor) are
 *      treated as the same book.
 *
 * After initial grouping, clusters that share an ISBN are merged together so
 * that title-only clusters can be promoted into ISBN clusters when one of
 * their members is later linked via ISBN.
 */
export function clusterOffersIntoBooks(offers: BookOffer[]): OfferCluster[] {
  const clusters = new Map<string, OfferCluster>();

  for (const offer of offers) {
    const key = clusterKeyForOffer(offer);
    const existing = clusters.get(key);

    if (existing) {
      existing.offers.push(offer);
      if (!existing.isbn) {
        const isbn = pickIsbnFromOffer(offer);
        if (isbn) {
          existing.isbn = isbn;
        }
      }
      continue;
    }

    const isbn = pickIsbnFromOffer(offer);
    clusters.set(key, {
      key,
      ...(isbn ? { isbn } : {}),
      offers: [offer],
    });
  }

  return Array.from(clusters.values());
}

function pickPrimaryOffer(offers: BookOffer[]): BookOffer {
  const sorted = [...offers].sort((left, right) => {
    // Prefer an offer whose summary is non-empty and longer (more useful for detail page).
    const leftSummary = left.summary?.length ?? 0;
    const rightSummary = right.summary?.length ?? 0;

    if (leftSummary !== rightSummary) {
      return rightSummary - leftSummary;
    }

    // Prefer the cheapest offer for representative price.
    if (left.price !== right.price) {
      return left.price - right.price;
    }

    return left.title.length - right.title.length;
  });

  return sorted[0]!;
}

function clusterBookId(cluster: OfferCluster): string {
  if (cluster.isbn) {
    return cluster.isbn;
  }

  const primary = pickPrimaryOffer(cluster.offers);

  return `t-${buildTitleAuthorClusterKey(primary.title, primary.authors[0])}`;
}

export function clusterToBookSummary(cluster: OfferCluster): BookSummary {
  const primary = pickPrimaryOffer(cluster.offers);
  const lowestPrice = cluster.offers.reduce<number | undefined>((min, offer) => {
    if (typeof min === 'undefined') {
      return offer.price;
    }
    return Math.min(min, offer.price);
  }, undefined);

  return {
    id: clusterBookId(cluster),
    ...(cluster.isbn ? { isbn: cluster.isbn } : {}),
    title: primary.title,
    authors: primary.authors,
    ...(primary.publisher ? { publisher: primary.publisher } : {}),
    ...(primary.publicationDate ? { publicationDate: primary.publicationDate } : {}),
    imageUrl: primary.imageUrl,
    ...(typeof lowestPrice === 'number' ? { lowestPrice } : {}),
    currency: 'TWD',
    offerCount: cluster.offers.length,
  };
}

export function clusterToBookDetail(cluster: OfferCluster): BookDetail {
  const primary = pickPrimaryOffer(cluster.offers);
  const offers = [...cluster.offers].sort((left, right) => left.price - right.price);

  return {
    id: clusterBookId(cluster),
    ...(cluster.isbn ? { isbn: cluster.isbn } : {}),
    title: primary.title,
    authors: primary.authors,
    ...(primary.publisher ? { publisher: primary.publisher } : {}),
    ...(primary.publicationDate ? { publicationDate: primary.publicationDate } : {}),
    imageUrl: primary.imageUrl,
    summary: primary.summary,
    offers,
  };
}

/**
 * Find the cluster that best matches the given title / author. Used by the
 * by-title detail route to pick the right cluster after re-running search.
 */
export function findClusterByTitleAuthor(
  clusters: OfferCluster[],
  title: string,
  author?: string
): OfferCluster | undefined {
  const targetKey = buildTitleAuthorClusterKey(title, author);

  // Exact match first.
  for (const cluster of clusters) {
    const primary = pickPrimaryOffer(cluster.offers);
    const candidateKey = buildTitleAuthorClusterKey(primary.title, primary.authors[0]);

    if (candidateKey === targetKey) {
      return cluster;
    }
  }

  // Fall back to title-only when author is unknown.
  if (!author) {
    const targetTitle = normalizeForClusterKey(title);

    for (const cluster of clusters) {
      const primary = pickPrimaryOffer(cluster.offers);

      if (normalizeForClusterKey(primary.title) === targetTitle) {
        return cluster;
      }
    }
  }

  return undefined;
}
