import Ionicons from '@expo/vector-icons/Ionicons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useLayoutEffect, useMemo } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { track } from '../../analytics';
import { useClearHistory, useHistory } from '../../api/history';
import { EmptyState } from '../../components/EmptyState';
import { activeLocale, strings } from '../../i18n/strings';
import { spacing } from '../../theme/spacing';
import { useTheme } from '../../theme/ThemeProvider';
import { typography } from '../../theme/typography';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HistoryEntry } from '../../lib/history';
import type { ThemeColors } from '../../theme/colors';
import type { HomeStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'History'>;

const dateTimeFormatter = new Intl.DateTimeFormat(activeLocale, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

function formatViewedAt(viewedAt: number): string {
  try {
    return dateTimeFormatter.format(new Date(viewedAt));
  } catch {
    return new Date(viewedAt).toISOString().slice(0, 16);
  }
}

function getEntryId(entry: HistoryEntry): string {
  return entry.type === 'isbn' ? `isbn:${entry.isbn}` : `title:${entry.title}`;
}

export function HistoryScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const tabBarHeight = useBottomTabBarHeight();
  const { data, isLoading } = useHistory();
  const clearHistory = useClearHistory();

  const hasHistory = (data?.length ?? 0) > 0;
  const entries = data ?? [];

  const openEntry = (entry: HistoryEntry) => {
    track('history_open_entry', { type: entry.type });
    if (entry.type === 'isbn') {
      navigation.navigate('SearchResult', { isbn: entry.isbn });
    } else {
      navigation.navigate('SearchResult', { title: entry.title });
    }
  };

  const handleClearAll = () => {
    track('history_click_clear_all');
    Alert.alert(strings.history.clearAllConfirmTitle, strings.history.clearAllConfirmMessage, [
      { text: strings.history.cancelAction, style: 'cancel' },
      {
        text: strings.history.clearAllConfirmAction,
        style: 'destructive',
        onPress: () => {
          track('history_clear_all_confirm');
          clearHistory.mutate();
        },
      },
    ]);
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        hasHistory ? (
          <Pressable
            accessibilityLabel={strings.history.clearAllAction}
            accessibilityRole="button"
            hitSlop={8}
            onPress={handleClearAll}
            style={({ pressed }) => [styles.headerAction, pressed && styles.headerActionPressed]}
          >
            <Text style={styles.headerActionText}>{strings.history.clearAllAction}</Text>
          </Pressable>
        ) : null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, hasHistory, styles]);

  if (!isLoading && (!data || data.length === 0)) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="time-outline"
          title={strings.history.emptyTitle}
          description={strings.history.emptyDescription}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={entries}
        keyExtractor={getEntryId}
        contentContainerStyle={[styles.listContent, { paddingBottom: tabBarHeight + spacing.xl }]}
        contentInsetAdjustmentBehavior="automatic"
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item, index }) => {
          const hasIsbnTitle = item.type === 'isbn' && Boolean(item.title);
          const primaryText =
            item.type === 'isbn' ? item.title || strings.history.isbnLabel(item.isbn) : item.title;
          const isbnLine = hasIsbnTitle ? strings.history.isbnLabel(item.isbn) : null;
          const isFirst = index === 0;
          const isLast = index === entries.length - 1;
          return (
            <Pressable
              accessibilityRole="button"
              android_ripple={{ color: colors.rowPressed }}
              onPress={() => openEntry(item)}
              style={({ pressed }) => [
                styles.row,
                isFirst && styles.rowFirst,
                isLast && styles.rowLast,
                pressed && styles.rowPressed,
              ]}
            >
              <View
                style={[
                  styles.iconTile,
                  {
                    backgroundColor: item.type === 'isbn' ? colors.accent : colors.accentDeep,
                  },
                ]}
              >
                <Ionicons
                  color="#ffffff"
                  name={item.type === 'isbn' ? 'barcode' : 'search'}
                  size={16}
                />
              </View>
              <View style={styles.body}>
                <Text style={styles.title} numberOfLines={2}>
                  {primaryText}
                </Text>
                {isbnLine ? (
                  <Text style={styles.isbn} numberOfLines={1}>
                    {isbnLine}
                  </Text>
                ) : null}
                <Text style={styles.meta} numberOfLines={1}>
                  {strings.history.viewedOn(formatViewedAt(item.viewedAt))}
                </Text>
              </View>
              <Ionicons color={colors.inkMuted} name="chevron-forward" size={16} />
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.groupedBackground,
    },
    listContent: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.divider,
      marginLeft: spacing.md + 28 + spacing.sm,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      backgroundColor: colors.surface,
      gap: spacing.sm,
    },
    rowFirst: {
      borderTopLeftRadius: 14,
      borderTopRightRadius: 14,
    },
    rowLast: {
      borderBottomLeftRadius: 14,
      borderBottomRightRadius: 14,
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
    },
    body: {
      flex: 1,
      gap: spacing.xxs,
    },
    title: {
      ...typography.subhead,
      color: colors.ink,
      fontWeight: '600',
    },
    isbn: {
      ...typography.footnote,
      color: colors.inkMuted,
    },
    meta: {
      ...typography.caption,
      color: colors.inkMuted,
    },
    headerAction: {
      paddingHorizontal: spacing.xs,
      paddingVertical: spacing.xxs,
    },
    headerActionPressed: {
      opacity: 0.6,
    },
    headerActionText: {
      ...typography.body,
      color: colors.navigationAction,
      fontWeight: '500',
    },
  });
