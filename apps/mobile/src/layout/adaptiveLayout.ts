import { spacing } from '../theme/spacing';

import type { ReservedRegion } from 'react-native-reserved-regions';

/** Window width from which content is laid out in two columns, like a regular-width size class. */
export const REGULAR_WIDTH_MIN = 600;
/** Widest single column for forms and grouped lists, margins included. */
export const READABLE_MAX_WIDTH = 640;
/** Narrowest pane worth placing content in beside a fold. */
export const MIN_PANE_WIDTH = 280;
/** Smallest gap between two columns, also used when no fold is active. */
export const MIN_COLUMN_GUTTER = spacing.md;

/** Horizontal range in window coordinates (points from the window's left edge). */
export interface HorizontalSpan {
  start: number;
  end: number;
}

export interface AdaptiveLayoutInput {
  windowWidth: number;
  insets: { left: number; right: number };
  /** Active vertical fold, such as iPhone Duo's hinge when partially open. */
  fold: HorizontalSpan | null;
}

export interface AdaptiveLayout {
  windowWidth: number;
  isRegularWidth: boolean;
  /** Spans for side-by-side columns: two on regular-width or folded windows, otherwise one. */
  columns: HorizontalSpan[];
  /** Span for a single column of content that must stay clear of the fold and the side rail. */
  readable: HorizontalSpan;
}

export interface ColumnLayout {
  numColumns: number;
  paddingLeft: number;
  paddingRight: number;
  columnGap: number;
  /** Width of each column; empty when there is a single column that fills the row. */
  columnWidths: number[];
}

export interface SpanPadding {
  paddingLeft: number;
  paddingRight: number;
}

const spanWidth = (span: HorizontalSpan) => span.end - span.start;

const widerSpan = (a: HorizontalSpan, b: HorizontalSpan) => (spanWidth(b) > spanWidth(a) ? b : a);

function centeredGutter(center: number, width: number): HorizontalSpan {
  return { start: center - width / 2, end: center + width / 2 };
}

/** Returns the first division that splits the window into left and right panes. */
export function findVerticalFold(regions: readonly ReservedRegion[]): HorizontalSpan | null {
  const division = regions.find(
    (region) => region.kind === 'division' && region.frame.height > region.frame.width
  );
  if (!division) {
    return null;
  }
  return { start: division.frame.x, end: division.frame.x + division.frame.width };
}

export function computeAdaptiveLayout({
  windowWidth,
  insets,
  fold,
}: AdaptiveLayoutInput): AdaptiveLayout {
  const safe: HorizontalSpan = { start: insets.left, end: windowWidth - insets.right };
  const isRegularWidth = windowWidth >= REGULAR_WIDTH_MIN;

  if (fold && fold.end > safe.start && fold.start < safe.end) {
    const foldInSafeArea = {
      start: Math.max(fold.start, safe.start),
      end: Math.min(fold.end, safe.end),
    };
    const gutter =
      spanWidth(foldInSafeArea) >= MIN_COLUMN_GUTTER
        ? foldInSafeArea
        : centeredGutter((foldInSafeArea.start + foldInSafeArea.end) / 2, MIN_COLUMN_GUTTER);
    const leading = { start: safe.start, end: Math.max(safe.start, gutter.start) };
    const trailing = { start: Math.min(safe.end, gutter.end), end: safe.end };
    const pane = widerSpan(leading, trailing);
    const fitsTwoPanes =
      spanWidth(leading) >= MIN_PANE_WIDTH && spanWidth(trailing) >= MIN_PANE_WIDTH;

    return {
      windowWidth,
      isRegularWidth,
      columns: fitsTwoPanes ? [leading, trailing] : [pane],
      readable: pane,
    };
  }

  if (!isRegularWidth) {
    return { windowWidth, isRegularWidth, columns: [safe], readable: safe };
  }

  // Splitting at the window centre keeps the gutter where iPhone Duo's hinge folds, so the
  // layout does not jump when the device moves between fully and partially open.
  const gutter = centeredGutter(windowWidth / 2, MIN_COLUMN_GUTTER);
  const leading = { start: safe.start, end: gutter.start };
  const trailing = { start: gutter.end, end: safe.end };
  const fitsTwoPanes =
    spanWidth(leading) >= MIN_PANE_WIDTH && spanWidth(trailing) >= MIN_PANE_WIDTH;
  const readableWidth = Math.min(spanWidth(safe), READABLE_MAX_WIDTH);
  const readableStart = safe.start + (spanWidth(safe) - readableWidth) / 2;

  return {
    windowWidth,
    isRegularWidth,
    columns: fitsTwoPanes ? [leading, trailing] : [safe],
    readable: { start: readableStart, end: readableStart + readableWidth },
  };
}

/** Padding that confines a full-width container's content to `span`, plus a margin on each side. */
export function getSpanPadding(span: HorizontalSpan, windowWidth: number, margin = 0): SpanPadding {
  return {
    paddingLeft: span.start + margin,
    paddingRight: windowWidth - span.end + margin,
  };
}

/** Converts the layout's columns into padding, gap, and widths for a full-width list. */
export function getColumnLayout(layout: AdaptiveLayout, margin: number): ColumnLayout {
  const [leading, trailing] = layout.columns;

  if (!leading) {
    return {
      numColumns: 1,
      paddingLeft: margin,
      paddingRight: margin,
      columnGap: 0,
      columnWidths: [],
    };
  }

  if (!trailing) {
    return {
      numColumns: 1,
      ...getSpanPadding(leading, layout.windowWidth, margin),
      columnGap: 0,
      columnWidths: [],
    };
  }

  return {
    numColumns: 2,
    paddingLeft: leading.start + margin,
    paddingRight: layout.windowWidth - trailing.end + margin,
    columnGap: trailing.start - leading.end,
    columnWidths: [spanWidth(leading) - margin, spanWidth(trailing) - margin],
  };
}
