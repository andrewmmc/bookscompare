import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { useReservedRegions } from 'react-native-reserved-regions';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { computeAdaptiveLayout, findVerticalFold, getSpanPadding } from './adaptiveLayout';

import type { AdaptiveLayout, SpanPadding } from './adaptiveLayout';

/**
 * Live layout for the current window: re-computes when the window resizes (iPhone Duo folding
 * or unfolding, Split View), when the side rail changes the safe area, and when the hinge fold
 * becomes active or inactive. Spans are in window coordinates, so apply them to full-width views.
 *
 * Requires a `ReservedRegionsProvider` covering the window (see `App.tsx`).
 */
export function useAdaptiveLayout(): AdaptiveLayout {
  const { width: windowWidth } = useWindowDimensions();
  const { left, right } = useSafeAreaInsets();
  const regions = useReservedRegions();
  const fold = useMemo(() => findVerticalFold(regions), [regions]);
  const foldStart = fold?.start;
  const foldEnd = fold?.end;

  return useMemo(
    () =>
      computeAdaptiveLayout({
        windowWidth,
        insets: { left, right },
        fold:
          foldStart === undefined || foldEnd === undefined
            ? null
            : { start: foldStart, end: foldEnd },
      }),
    [windowWidth, left, right, foldStart, foldEnd]
  );
}

/** Horizontal padding that keeps a full-width view's content in the readable span. */
export function useReadablePadding(margin = 0): SpanPadding {
  const { readable, windowWidth } = useAdaptiveLayout();
  return useMemo(
    () => getSpanPadding(readable, windowWidth, margin),
    [readable, windowWidth, margin]
  );
}
