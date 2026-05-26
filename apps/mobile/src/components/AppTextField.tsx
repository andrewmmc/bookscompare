import Ionicons from '@expo/vector-icons/Ionicons';
import { forwardRef, useMemo } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { spacing } from '../theme/spacing';
import { useTheme } from '../theme/ThemeProvider';
import { typography } from '../theme/typography';

import type { ReactNode } from 'react';
import type { StyleProp, TextInputProps, ViewStyle } from 'react-native';
import type { ThemeColors } from '../theme/colors';

interface AppTextFieldProps extends Omit<TextInputProps, 'style' | 'placeholderTextColor'> {
  /** Rendered before the input text (e.g. search glyph). */
  leadingIcon?: keyof typeof Ionicons.glyphMap;
  /** Show a clear (×) button on the right side when the value is non-empty. */
  onClear?: () => void;
  clearAccessibilityLabel?: string;
  /** Optional element rendered after the clear button (e.g. submit affordance). */
  trailing?: ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * iOS 26 rounded-rect search/text field. Translucent grouped-background fill,
 * radius 10, height 44, optional leading icon and clear button. No underline.
 */
export const AppTextField = forwardRef<TextInput, AppTextFieldProps>(function AppTextField(
  { leadingIcon, onClear, clearAccessibilityLabel, trailing, containerStyle, value, ...inputProps },
  ref
) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const showClear = onClear && typeof value === 'string' && value.length > 0;

  return (
    <View style={[styles.container, containerStyle]}>
      {leadingIcon ? (
        <Ionicons color={colors.inkMuted} name={leadingIcon} size={18} style={styles.leading} />
      ) : null}
      <TextInput
        ref={ref}
        value={value}
        placeholderTextColor={colors.inkMuted}
        style={styles.input}
        selectionColor={colors.accent}
        {...inputProps}
      />
      {showClear ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={clearAccessibilityLabel}
          hitSlop={8}
          onPress={onClear}
          style={({ pressed }) => [styles.clear, pressed && styles.clearPressed]}
        >
          <Ionicons color={colors.inkMuted} name="close-circle" size={18} />
        </Pressable>
      ) : null}
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
    </View>
  );
});

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 44,
      borderRadius: 10,
      backgroundColor: colors.groupedBackground,
      paddingHorizontal: spacing.sm,
    },
    leading: {
      marginRight: spacing.xs,
    },
    input: {
      flex: 1,
      ...typography.body,
      color: colors.ink,
      paddingVertical: spacing.xs,
    },
    clear: {
      paddingHorizontal: spacing.xxs,
      paddingVertical: spacing.xxs,
    },
    clearPressed: {
      opacity: 0.6,
    },
    trailing: {
      marginLeft: spacing.xs,
    },
  });
