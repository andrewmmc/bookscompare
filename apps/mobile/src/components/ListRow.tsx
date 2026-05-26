import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { spacing } from '../theme/spacing';
import { useTheme } from '../theme/ThemeProvider';
import { typography } from '../theme/typography';

import type { StyleProp, ViewStyle } from 'react-native';
import type { ThemeColors } from '../theme/colors';

interface ListRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  onPress: () => void;
  /** Optional iOS-style detail value rendered right-aligned before the chevron. */
  value?: string;
  /** Tint for the rounded icon tile; defaults to theme accent. */
  iconBackground?: string;
  /** Render the title in destructive red (used for sign-out / delete style rows). */
  destructive?: boolean;
  /** Hide the trailing chevron (e.g. for non-navigating destructive actions). */
  hideChevron?: boolean;
  /** Hide the bottom divider when this is the last row in a grouped section. */
  isLast?: boolean;
  /** Optional override for the row container (e.g. background color). */
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

/**
 * iOS 26 grouped-list row. Renders a rounded tinted icon tile, title, optional
 * detail value, and chevron. Pair with a parent container that sets the section
 * background, radius, and horizontal margin to get the grouped-card look.
 */
export function ListRow({
  icon,
  title,
  onPress,
  value,
  iconBackground,
  destructive = false,
  hideChevron = false,
  isLast = false,
  style,
  accessibilityLabel,
}: ListRowProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const tileBg = iconBackground ?? (destructive ? colors.danger : colors.accent);
  const titleColor = destructive ? colors.danger : colors.ink;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? (value ? `${title}, ${value}` : title)}
      android_ripple={{ color: colors.rowPressed }}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed, style]}
    >
      <View style={[styles.iconTile, { backgroundColor: tileBg }]}>
        <Ionicons color="#ffffff" name={icon} size={18} />
      </View>
      <View style={[styles.content, !isLast && styles.contentDivider]}>
        <Text style={[styles.title, { color: titleColor }]} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.right}>
          {value ? (
            <Text style={styles.value} numberOfLines={1}>
              {value}
            </Text>
          ) : null}
          {hideChevron ? null : (
            <Ionicons color={colors.inkMuted} name="chevron-forward" size={16} />
          )}
        </View>
      </View>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingLeft: spacing.md,
      minHeight: 44,
      backgroundColor: colors.surface,
    },
    rowPressed: {
      backgroundColor: colors.rowPressed,
    },
    iconTile: {
      width: 28,
      height: 28,
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.sm,
    },
    content: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm - 2,
      paddingRight: spacing.md,
    },
    contentDivider: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.divider,
    },
    title: {
      ...typography.body,
      flexShrink: 1,
    },
    right: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: spacing.sm,
      gap: spacing.xxs,
    },
    value: {
      ...typography.body,
      color: colors.inkMuted,
    },
  });
