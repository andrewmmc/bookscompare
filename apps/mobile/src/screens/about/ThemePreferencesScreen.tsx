import Ionicons from '@expo/vector-icons/Ionicons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { track } from '../../analytics';
import { strings } from '../../i18n/strings';
import { updatePreference, usePreferences } from '../../lib/preferences';
import { spacing } from '../../theme/spacing';
import { useTheme } from '../../theme/ThemeProvider';
import { typography } from '../../theme/typography';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ThemeMode } from '../../lib/preferences';
import type { ThemeColors } from '../../theme/colors';
import type { AboutStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AboutStackParamList, 'ThemePreferences'>;

const options: Array<{ value: ThemeMode; label: string }> = [
  { value: 'system', label: strings.settings.appearanceSystem },
  { value: 'light', label: strings.settings.appearanceLight },
  { value: 'dark', label: strings.settings.appearanceDark },
];

export function ThemePreferencesScreen(_props: Props) {
  const { colors } = useTheme();
  const { themeMode } = usePreferences();
  const tabBarHeight = useBottomTabBarHeight();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const selectOption = (value: ThemeMode) => {
    if (value === themeMode) {
      return;
    }

    track('settings_change', { key: 'themeMode', value });
    void updatePreference('themeMode', value);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingBottom: tabBarHeight + spacing.xl },
      ]}
      contentInsetAdjustmentBehavior="automatic"
    >
      <Text style={styles.description}>{strings.settings.appearanceDescription}</Text>
      <View style={styles.group}>
        {options.map((option, index) => {
          const isLast = index === options.length - 1;
          const selected = option.value === themeMode;

          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => selectOption(option.value)}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              testID={`theme-option-${option.value}`}
            >
              <View style={[styles.rowContent, !isLast && styles.rowDivider]}>
                <Text style={styles.label}>{option.label}</Text>
                {selected ? <Ionicons color={colors.accent} name="checkmark" size={20} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.groupedBackground,
    },
    contentContainer: {
      paddingTop: spacing.md,
    },
    description: {
      ...typography.footnote,
      color: colors.inkMuted,
      paddingHorizontal: spacing.md + spacing.xs,
      paddingBottom: spacing.sm,
    },
    group: {
      marginHorizontal: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: 14,
      overflow: 'hidden',
    },
    row: {
      paddingLeft: spacing.md,
      backgroundColor: colors.surface,
    },
    rowPressed: {
      backgroundColor: colors.rowPressed,
    },
    rowContent: {
      minHeight: 44,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingRight: spacing.md,
    },
    rowDivider: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.divider,
    },
    label: {
      ...typography.body,
      color: colors.ink,
      flexShrink: 1,
    },
  });
