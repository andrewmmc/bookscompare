import type { TextStyle } from 'react-native';

function textStyle(style: TextStyle): TextStyle {
  return style;
}

export const typography = {
  hero: textStyle({
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
  }),
  sectionTitle: textStyle({
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
  }),
  stackTitle: textStyle({
    fontSize: 17,
    fontWeight: '600',
  }),
  body: textStyle({
    fontSize: 16,
    lineHeight: 22,
  }),
  kicker: textStyle({
    fontSize: 13,
    lineHeight: 18,
  }),
  caption: textStyle({
    fontSize: 13,
    lineHeight: 18,
  }),
  tabLabel: textStyle({
    fontSize: 12,
  }),
  price: textStyle({
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '700',
  }),
} as const;
