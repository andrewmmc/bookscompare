import type { TextStyle } from 'react-native';

function textStyle(style: TextStyle): TextStyle {
  return style;
}

// iOS 26 type scale (SF Pro inspired). Sizes/weights mirror Apple HIG.
export const typography = {
  title2: textStyle({
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    letterSpacing: -0.2,
  }),
  title3: textStyle({
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '600',
  }),
  headline: textStyle({
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
  }),
  body: textStyle({
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
  }),
  subhead: textStyle({
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400',
  }),
  footnote: textStyle({
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  }),
  caption: textStyle({
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  }),
  caption2: textStyle({
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '400',
  }),
  // Domain-specific
  price: textStyle({
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '700',
  }),
  tabLabel: textStyle({
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '500',
  }),
} as const;
