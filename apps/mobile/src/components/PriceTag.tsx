import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

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
      <Text style={styles.currency}>{currency}</Text>
      <Text style={styles.price}>{price.toLocaleString('en-US')}</Text>
      {discountRate ? (
        <Text style={styles.discount}>{strings.priceTag.discountTag(discountRate)}</Text>
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
    currency: {
      ...typography.caption,
      color: colors.inkMuted,
    },
    price: {
      ...typography.price,
      color: colors.accent,
    },
    discount: {
      ...typography.caption,
      color: colors.accent,
    },
  });
