import Ionicons from '@expo/vector-icons/Ionicons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { spacing } from '../theme/spacing';
import { useTheme } from '../theme/ThemeProvider';
import { typography } from '../theme/typography';

import type { ReactNode } from 'react';
import type { ThemeColors } from '../theme/colors';

interface PreferenceOption<T extends string> {
  value: T;
  label: string;
}

interface ToggleListScreenProps<T extends string> {
  description: string;
  options: Array<PreferenceOption<T>>;
  isSelected: (value: T) => boolean;
  onToggle: (value: T) => void;
  testIDPrefix: string;
}

/** Grouped list of multi-select rows, each backed by a Switch. */
export function ToggleListScreen<T extends string>({
  description,
  options,
  isSelected,
  onToggle,
  testIDPrefix,
}: ToggleListScreenProps<T>) {
  const { colors } = useTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <PreferenceScrollView styles={styles} tabBarHeight={tabBarHeight} description={description}>
      {options.map((option, index) => {
        const isLast = index === options.length - 1;
        return (
          <View key={option.value} style={styles.row}>
            <View style={[styles.toggleRowContent, !isLast && styles.rowDivider]}>
              <Text style={styles.label}>{option.label}</Text>
              <Switch
                testID={`${testIDPrefix}-${option.value}`}
                value={isSelected(option.value)}
                onValueChange={() => onToggle(option.value)}
                trackColor={{ true: colors.accent, false: undefined }}
              />
            </View>
          </View>
        );
      })}
    </PreferenceScrollView>
  );
}

interface SelectionListScreenProps<T extends string> {
  description: string;
  options: Array<PreferenceOption<T>>;
  selectedValue: T;
  onSelect: (value: T) => void;
  testIDPrefix: string;
}

/** Grouped list of single-select rows, each marked with a checkmark when active. */
export function SelectionListScreen<T extends string>({
  description,
  options,
  selectedValue,
  onSelect,
  testIDPrefix,
}: SelectionListScreenProps<T>) {
  const { colors } = useTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <PreferenceScrollView styles={styles} tabBarHeight={tabBarHeight} description={description}>
      {options.map((option, index) => {
        const isLast = index === options.length - 1;
        const selected = option.value === selectedValue;

        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onSelect(option.value)}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            testID={`${testIDPrefix}-${option.value}`}
          >
            <View style={[styles.selectionRowContent, !isLast && styles.rowDivider]}>
              <Text style={styles.label}>{option.label}</Text>
              {selected ? <Ionicons color={colors.accent} name="checkmark" size={20} /> : null}
            </View>
          </Pressable>
        );
      })}
    </PreferenceScrollView>
  );
}

interface PreferenceScrollViewProps {
  styles: ReturnType<typeof createStyles>;
  tabBarHeight: number;
  description: string;
  children: ReactNode;
}

function PreferenceScrollView({
  styles,
  tabBarHeight,
  description,
  children,
}: PreferenceScrollViewProps) {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingBottom: tabBarHeight + spacing.xl },
      ]}
      contentInsetAdjustmentBehavior="automatic"
    >
      <Text style={styles.description}>{description}</Text>
      <View style={styles.group}>{children}</View>
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
    toggleRowContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm - 2,
      paddingRight: spacing.md,
    },
    selectionRowContent: {
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
