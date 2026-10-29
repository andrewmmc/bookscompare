import {
  computeAdaptiveLayout,
  findVerticalFold,
  getColumnLayout,
  getSpanPadding,
  MIN_COLUMN_GUTTER,
  READABLE_MAX_WIDTH,
} from './adaptiveLayout';

import type { ReservedRegion } from 'react-native-reserved-regions';
import type { AdaptiveLayout, ColumnLayout } from './adaptiveLayout';

const noInsets = { left: 0, right: 0 };

function expectRowFillsWindow(columns: ColumnLayout, layout: AdaptiveLayout) {
  const rowWidth =
    columns.paddingLeft +
    columns.columnWidths.reduce((sum, width) => sum + width, 0) +
    columns.columnGap * (columns.numColumns - 1) +
    columns.paddingRight;
  expect(rowWidth).toBeCloseTo(layout.windowWidth);
}

describe('findVerticalFold', () => {
  it('returns the x-range of a division taller than it is wide', () => {
    const regions: ReservedRegion[] = [
      { kind: 'occlusion', frame: { x: 10, y: 0, width: 40, height: 40 } },
      { kind: 'division', frame: { x: 440, y: 0, width: 20, height: 760 }, occludesContent: false },
    ];

    expect(findVerticalFold(regions)).toEqual({ start: 440, end: 460 });
  });

  it('ignores occlusions and horizontal divisions', () => {
    const regions: ReservedRegion[] = [
      { kind: 'occlusion', frame: { x: 0, y: 0, width: 20, height: 400 } },
      { kind: 'division', frame: { x: 0, y: 380, width: 900, height: 20 }, occludesContent: false },
    ];

    expect(findVerticalFold(regions)).toBeNull();
  });
});

describe('computeAdaptiveLayout', () => {
  it('keeps a phone-width window in a single full-width column', () => {
    const layout = computeAdaptiveLayout({ windowWidth: 393, insets: noInsets, fold: null });

    expect(layout.isRegularWidth).toBe(false);
    expect(layout.columns).toEqual([{ start: 0, end: 393 }]);
    expect(layout.readable).toEqual({ start: 0, end: 393 });
    expect(getColumnLayout(layout, 16)).toEqual({
      numColumns: 1,
      paddingLeft: 16,
      paddingRight: 16,
      columnGap: 0,
      columnWidths: [],
    });
  });

  it('keeps content clear of a side rail on a compact window', () => {
    const layout = computeAdaptiveLayout({
      windowWidth: 560,
      insets: { left: 0, right: 84 },
      fold: null,
    });

    expect(layout.columns).toEqual([{ start: 0, end: 476 }]);
    expect(getSpanPadding(layout.readable, layout.windowWidth, 24)).toEqual({
      paddingLeft: 24,
      paddingRight: 108,
    });
  });

  it('splits a regular-width window at its centre and centres readable content', () => {
    const layout = computeAdaptiveLayout({ windowWidth: 900, insets: noInsets, fold: null });

    expect(layout.isRegularWidth).toBe(true);
    expect(layout.columns).toEqual([
      { start: 0, end: 450 - MIN_COLUMN_GUTTER / 2 },
      { start: 450 + MIN_COLUMN_GUTTER / 2, end: 900 },
    ]);
    expect(layout.readable).toEqual({
      start: (900 - READABLE_MAX_WIDTH) / 2,
      end: (900 + READABLE_MAX_WIDTH) / 2,
    });

    const columns = getColumnLayout(layout, 16);
    expect(columns.numColumns).toBe(2);
    expect(columns.columnGap).toBe(MIN_COLUMN_GUTTER);
    expectRowFillsWindow(columns, layout);
  });

  it('keeps the column gutter at the window centre when a side rail makes the safe area asymmetric', () => {
    const layout = computeAdaptiveLayout({
      windowWidth: 900,
      insets: { left: 0, right: 84 },
      fold: null,
    });

    expect(layout.columns[0]?.end).toBe(450 - MIN_COLUMN_GUTTER / 2);
    expect(layout.columns[1]).toEqual({ start: 450 + MIN_COLUMN_GUTTER / 2, end: 816 });
    expect(layout.readable.end).toBeLessThanOrEqual(816);
    expectRowFillsWindow(getColumnLayout(layout, 16), layout);
  });

  it('places columns on either side of an active fold', () => {
    const layout = computeAdaptiveLayout({
      windowWidth: 900,
      insets: { left: 0, right: 84 },
      fold: { start: 430, end: 470 },
    });

    expect(layout.columns).toEqual([
      { start: 0, end: 430 },
      { start: 470, end: 816 },
    ]);
    expect(layout.readable).toEqual({ start: 0, end: 430 });

    const columns = getColumnLayout(layout, 16);
    expect(columns.columnGap).toBe(40);
    expect(columns.columnWidths).toEqual([414, 330]);
    expectRowFillsWindow(columns, layout);
  });

  it('widens a thin fold to the minimum gutter', () => {
    const layout = computeAdaptiveLayout({
      windowWidth: 900,
      insets: noInsets,
      fold: { start: 448, end: 452 },
    });

    expect(layout.columns[1]!.start - layout.columns[0]!.end).toBe(MIN_COLUMN_GUTTER);
  });

  it('uses the wider side when a fold leaves too little room for two panes', () => {
    const layout = computeAdaptiveLayout({
      windowWidth: 469,
      insets: { left: 84, right: 0 },
      fold: { start: 440, end: 480 },
    });

    expect(layout.columns).toEqual([{ start: 84, end: 440 }]);
    expect(layout.readable).toEqual({ start: 84, end: 440 });
  });

  it('ignores a fold that lies entirely outside the safe area', () => {
    const layout = computeAdaptiveLayout({
      windowWidth: 393,
      insets: noInsets,
      fold: { start: 400, end: 420 },
    });

    expect(layout.columns).toEqual([{ start: 0, end: 393 }]);
  });
});
