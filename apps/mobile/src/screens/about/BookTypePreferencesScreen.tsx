import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { track } from '../../analytics';
import { strings } from '../../i18n/strings';
import { updatePreference, usePreferences } from '../../lib/preferences';
import { spacing } from '../../theme/spacing';
import { useTheme } from '../../theme/ThemeProvider';
import { typography } from '../../theme/typography';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BookTypePreference } from '../../lib/preferences';
import type { ThemeColors } from '../../theme/colors';
import type { AboutStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AboutStackParamList, 'BookTypePreferences'>;

const bookTypeOptions: Array<{ value: BookTypePreference; label: string }> = [
  { value: 'physical', label: strings.settings.bookTypePhysical },
  { value: 'ebook', label: strings.settings.bookTypeEbook },
];

export function BookTypePreferencesScreen(_props: Props) {
  const { colors } = useTheme();
  const { preferredBookTypes } = usePreferences();
  const tabBarHeight = useBottomTabBarHeight();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const preferredSet = useMemo(() => new Set(preferredBookTypes), [preferredBookTypes]);

  const toggleBookType = (nextValue: BookTypePreference) => {
    const nextPreference = preferredSet.has(nextValue)
      ? preferredBookTypes.filter((value) => value !== nextValue)
      : [...preferredBookTypes, nextValue];

    track('settings_change', { key: 'preferredBookTypes', value: nextPreference.join(',') });
    void updatePreference('preferredBookTypes', nextPreference);
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
      <Text style={styles.description}>{strings.settings.bookTypeDescription}</Text>
      <View style={styles.group}>
        {bookTypeOptions.map((option, index) => {
          const isLast = index === bookTypeOptions.length - 1;
          return (
            <View key={option.value} style={styles.row}>
              <View style={[styles.rowContent, !isLast && styles.rowDivider]}>
                <Text style={styles.label}>{option.label}</Text>
                <Switch
                  testID={`book-type-toggle-${option.value}`}
                  value={preferredSet.has(option.value)}
                  onValueChange={() => toggleBookType(option.value)}
                  trackColor={{ true: colors.accent, false: undefined }}
                />
              </View>
            </View>
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
    rowContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm - 2,
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
