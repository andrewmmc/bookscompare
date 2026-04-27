import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

interface ListRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  onPress: () => void;
}

export function ListRow({ icon, title, onPress }: ListRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      android_ripple={{ color: colors.highlightSoft }}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={styles.leftIconWrap}>
        <Ionicons color={colors.accent} name={icon} size={24} />
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <Ionicons color={colors.divider} name="chevron-forward" size={20} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
    backgroundColor: colors.surface,
  },
  rowPressed: {
    backgroundColor: colors.highlightSoft,
  },
  leftIconWrap: {
    width: 32,
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  title: {
    ...typography.body,
    color: colors.ink,
    flex: 1,
  },
});
