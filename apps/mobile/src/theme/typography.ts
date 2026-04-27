import { Platform } from 'react-native';

import type { TextStyle } from 'react-native';

const displayFont = Platform.select({ ios: 'Georgia-Bold', default: 'serif' });
const bodyFont = Platform.select({ ios: 'Avenir Next', default: 'sans-serif' });
const bodyMediumFont = Platform.select({
  ios: 'Avenir Next Demi Bold',
  default: 'sans-serif-medium',
});

function textStyle(style: TextStyle): TextStyle {
  return style;
}

export const typography = {
  hero: textStyle({
    fontFamily: displayFont,
    fontSize: 38,
    lineHeight: 44,
    letterSpacing: -0.8,
  }),
  sectionTitle: textStyle({
    fontFamily: displayFont,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.4,
  }),
  stackTitle: textStyle({
    fontFamily: bodyMediumFont,
    fontSize: 17,
  }),
  body: textStyle({
    fontFamily: bodyFont,
    fontSize: 16,
    lineHeight: 24,
  }),
  kicker: textStyle({
    fontFamily: bodyMediumFont,
    fontSize: 12,
    lineHeight: 16,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  }),
  caption: textStyle({
    fontFamily: bodyFont,
    fontSize: 13,
    lineHeight: 18,
  }),
  tabLabel: textStyle({
    fontFamily: bodyMediumFont,
    fontSize: 12,
  }),
  price: textStyle({
    fontFamily: displayFont,
    fontSize: 24,
    lineHeight: 28,
  }),
} as const;
