import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { strings } from '../i18n/strings';
import { spacing } from '../theme/spacing';
import { useTheme } from '../theme/ThemeProvider';
import { typography } from '../theme/typography';

import type { ThemeColors } from '../theme/colors';

interface PriceTagProps {
  currency: string;
  price: number;
  discountRate?: number;
}

export function PriceTag({ currency, price, discountRate }: PriceTagProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <View style={styles.priceRow}>
        <Text style={styles.currency}>{currency}</Text>
        <Text style={styles.price}>{price.toLocaleString('en-US')}</Text>
      </View>
      {discountRate ? (
        <View style={styles.discountChip}>
          <Text style={styles.discountText}>{strings.priceTag.discountTag(discountRate)}</Text>
        </View>
      ) : null}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      alignItems: 'flex-end',
      gap: spacing.xxs,
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 2,
    },
    currency: {
      ...typography.footnote,
      color: colors.inkMuted,
    },
    price: {
      ...typography.price,
      color: colors.accent,
    },
    discountChip: {
      paddingHorizontal: spacing.xs,
      paddingVertical: 2,
      borderRadius: 10,
      backgroundColor: colors.highlight,
    },
    discountText: {
      ...typography.caption2,
      color: colors.accentDeep,
      fontWeight: '600',
    },
  });
