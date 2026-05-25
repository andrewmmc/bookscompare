import Ionicons from '@expo/vector-icons/Ionicons';
import { useLayoutEffect } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { track } from '../../analytics';
import { useClearHistory, useHistory } from '../../api/history';
import { EmptyState } from '../../components/EmptyState';
import { activeLocale, strings } from '../../i18n/strings';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HistoryEntry } from '../../lib/history';
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
  const { data, isLoading } = useHistory();
  const clearHistory = useClearHistory();

  const hasHistory = (data?.length ?? 0) > 0;

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
  }, [navigation, hasHistory]);

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
        data={data ?? []}
        keyExtractor={getEntryId}
        ListHeaderComponent={<View style={styles.listEdge} />}
        ListFooterComponent={<View style={styles.listEdge} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => {
          const primaryText = item.type === 'isbn' ? item.title || item.isbn : item.title;
          return (
            <Pressable
              accessibilityRole="button"
              android_ripple={{ color: colors.rowPressed }}
              onPress={() => openEntry(item)}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            >
              <View style={styles.iconWrap}>
                <Ionicons
                  color={colors.inkMuted}
                  name={item.type === 'isbn' ? 'barcode-outline' : 'search-outline'}
                  size={20}
                />
              </View>
              <View style={styles.body}>
                <Text style={styles.title} numberOfLines={2}>
                  {primaryText}
                </Text>
                <Text style={styles.meta}>
                  {strings.history.viewedOn(formatViewedAt(item.viewedAt))}
                </Text>
              </View>
              <Ionicons color={colors.divider} name="chevron-forward" size={20} />
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
    marginLeft: spacing.md + 32 + spacing.sm,
  },
  listEdge: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  rowPressed: {
    backgroundColor: colors.rowPressed,
  },
  iconWrap: {
    width: 32,
    alignItems: 'center',
  },
  body: {
    flex: 1,
    gap: spacing.xxs,
  },
  title: {
    ...typography.body,
    color: colors.ink,
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
    color: colors.accent,
    fontWeight: '600',
  },
});
