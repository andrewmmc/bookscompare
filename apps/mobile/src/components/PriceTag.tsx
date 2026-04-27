import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

interface PriceTagProps {
  currency: string;
  price: number;
  discountRate?: number;
}

export function PriceTag({ currency, price, discountRate }: PriceTagProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.currency}>{currency}</Text>
      <Text style={styles.price}>{price.toLocaleString('en-US')}</Text>
      {discountRate ? <Text style={styles.discount}>{discountRate}折</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
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
