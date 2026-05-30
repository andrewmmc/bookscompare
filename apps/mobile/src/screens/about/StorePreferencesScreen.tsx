import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { BOOK_SOURCES } from '@bookscompare/contracts';

import { track } from '../../analytics';
import { strings } from '../../i18n/strings';
import { updatePreference, usePreferences } from '../../lib/preferences';
import { spacing } from '../../theme/spacing';
import { useTheme } from '../../theme/ThemeProvider';
import { typography } from '../../theme/typography';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BookSourceId } from '@bookscompare/contracts';
import type { ThemeColors } from '../../theme/colors';
import type { AboutStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AboutStackParamList, 'StorePreferences'>;

export function StorePreferencesScreen(_props: Props) {
  const { colors } = useTheme();
  const { preferredSources } = usePreferences();
  const tabBarHeight = useBottomTabBarHeight();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const preferredSet = useMemo(() => new Set(preferredSources), [preferredSources]);

  const toggleSource = (sourceId: BookSourceId) => {
    const next = preferredSet.has(sourceId)
      ? preferredSources.filter((id) => id !== sourceId)
      : [...preferredSources, sourceId];

    track('settings_change', { key: 'preferredSources', value: next.join(',') });
    void updatePreference('preferredSources', next);
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
      <Text style={styles.description}>{strings.storePreferences.description}</Text>
      <View style={styles.group}>
        {BOOK_SOURCES.map((source, index) => {
          const isLast = index === BOOK_SOURCES.length - 1;
          return (
            <View key={source.id} style={styles.row}>
              <View style={[styles.rowContent, !isLast && styles.rowDivider]}>
                <Text style={styles.label}>{source.name}</Text>
                <Switch
                  testID={`store-toggle-${source.id}`}
                  value={preferredSet.has(source.id)}
                  onValueChange={() => toggleSource(source.id)}
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
