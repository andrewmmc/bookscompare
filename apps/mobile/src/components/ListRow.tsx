import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { spacing } from '../theme/spacing';
import { useTheme } from '../theme/ThemeProvider';
import { typography } from '../theme/typography';

import type { ThemeColors } from '../theme/colors';

interface ListRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  onPress: () => void;
}

export function ListRow({ icon, title, onPress }: ListRowProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Pressable
      accessibilityRole="button"
      android_ripple={{ color: colors.rowPressed }}
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

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
      backgroundColor: colors.rowPressed,
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
