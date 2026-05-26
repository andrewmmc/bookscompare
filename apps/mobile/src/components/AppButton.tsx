import { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { spacing } from '../theme/spacing';
import { useTheme } from '../theme/ThemeProvider';
import { typography } from '../theme/typography';

import type { ReactNode } from 'react';
import type { PressableProps, StyleProp, ViewStyle } from 'react-native';
import type { ThemeColors } from '../theme/colors';

type Variant = 'primary' | 'secondary' | 'plain' | 'destructive';
type Size = 'regular' | 'large';

interface AppButtonProps extends Omit<
  PressableProps,
  'children' | 'style' | 'disabled' | 'onPress'
> {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  leadingIcon?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * iOS 26 capsule button. Pill-shaped, semibold label, soft shadow on primary.
 *
 * - `primary`: filled with accent, white label, light shadow.
 * - `secondary`: tinted fill (highlight) with accent label.
 * - `plain`: transparent with accent label (used for inline CTAs).
 * - `destructive`: filled with danger, white label.
 */
export function AppButton({
  label,
  onPress,
  variant = 'primary',
  size = 'regular',
  disabled = false,
  loading = false,
  fullWidth = false,
  leadingIcon,
  style,
  ...pressableProps
}: AppButtonProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isDisabled = disabled || loading;

  const sizeStyle = size === 'large' ? styles.containerLarge : styles.containerRegular;
  const labelSize = size === 'large' ? styles.labelLarge : styles.labelRegular;
  const variantStyle = styles[`container_${variant}` as const];
  const variantLabel = styles[`label_${variant}` as const];
  const spinnerColor =
    variant === 'primary' || variant === 'destructive' ? '#ffffff' : colors.accent;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      onPress={onPress}
      disabled={isDisabled}
      hitSlop={8}
      style={({ pressed }) => [
        styles.containerBase,
        sizeStyle,
        variantStyle,
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && styles.containerPressed,
        isDisabled && styles.containerDisabled,
        style,
      ]}
      {...pressableProps}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <View style={styles.row}>
          {leadingIcon ? <View style={styles.leadingIcon}>{leadingIcon}</View> : null}
          <Text style={[styles.labelBase, labelSize, variantLabel]} numberOfLines={1}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    containerBase: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
      alignSelf: 'flex-start',
    },
    containerRegular: {
      minHeight: 44,
      borderRadius: 22,
    },
    containerLarge: {
      minHeight: 52,
      borderRadius: 26,
      paddingHorizontal: spacing.xl,
    },
    fullWidth: {
      alignSelf: 'stretch',
    },
    containerPressed: {
      opacity: 0.85,
      transform: [{ scale: 0.98 }],
    },
    containerDisabled: {
      opacity: 0.45,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    leadingIcon: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    labelBase: {
      fontWeight: '600',
      letterSpacing: -0.1,
      textAlign: 'center',
    },
    labelRegular: {
      ...typography.headline,
    },
    labelLarge: {
      ...typography.headline,
      fontSize: 17,
    },
    // Primary: filled accent.
    container_primary: {
      backgroundColor: colors.accent,
      shadowColor: colors.shadow,
      shadowOpacity: 0.16,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 3 },
      elevation: 3,
    },
    label_primary: {
      color: '#ffffff',
    },
    // Secondary: tinted fill.
    container_secondary: {
      backgroundColor: colors.highlight,
    },
    label_secondary: {
      color: colors.accentDeep,
    },
    // Plain: no background, accent text.
    container_plain: {
      backgroundColor: 'transparent',
      paddingHorizontal: spacing.sm,
    },
    label_plain: {
      color: colors.accent,
    },
    // Destructive: filled danger.
    container_destructive: {
      backgroundColor: colors.danger,
      shadowColor: colors.shadow,
      shadowOpacity: 0.16,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 3 },
      elevation: 3,
    },
    label_destructive: {
      color: '#ffffff',
    },
  });
