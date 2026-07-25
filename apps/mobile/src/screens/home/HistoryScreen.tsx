import Ionicons from '@expo/vector-icons/Ionicons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Snackbar } from 'react-native-paper';

import { track } from '../../analytics';
import {
  useClearHistory,
  useHistory,
  useRemoveHistoryEntry,
  useRestoreHistoryEntry,
} from '../../api/history';
import { useClearAllHeaderAction } from '../../components/ClearAllHeaderButton';
import { EmptyState } from '../../components/EmptyState';
import { SwipeToDeleteRow } from '../../components/SwipeToDeleteRow';
import { useShakeToUndo } from '../../hooks/useShakeToUndo';
import { strings } from '../../i18n/strings';
import { formatDateTime } from '../../lib/datetime';
import { getHistoryEntryId } from '../../lib/history';
import { updatePreference, usePreferences } from '../../lib/preferences';
import { spacing } from '../../theme/spacing';
import { useTheme } from '../../theme/ThemeProvider';
import { typography } from '../../theme/typography';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HistoryEntry } from '../../lib/history';
import type { ThemeColors } from '../../theme/colors';
import type { HomeStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'History'>;

export function HistoryScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const tabBarHeight = useBottomTabBarHeight();
  const { data, isLoading } = useHistory();
  const removeHistoryEntry = useRemoveHistoryEntry();
  const restoreHistoryEntry = useRestoreHistoryEntry();
  const clearHistory = useClearHistory();
  const { historySortDirection = 'desc' } = usePreferences();
  const [openItemId, setOpenItemId] = useState<string | null>(null);
  const [undoCandidate, setUndoCandidate] = useState<HistoryEntry | null>(null);
  const [showUndoHint, setShowUndoHint] = useState(false);

  const hasHistory = (data?.length ?? 0) > 0;
  const entries = useMemo(
    () =>
      (data ?? [])
        .slice()
        .sort((a, b) =>
          historySortDirection === 'desc' ? b.viewedAt - a.viewedAt : a.viewedAt - b.viewedAt
        ),
    [historySortDirection, data]
  );

  const openEntry = (entry: HistoryEntry) => {
    track('history_open_entry', { type: entry.type });
    if (entry.type === 'isbn') {
      navigation.navigate('SearchResult', { isbn: entry.isbn });
    } else {
      navigation.navigate('SearchResult', { title: entry.title });
    }
  };

  const handleRemove = (entry: HistoryEntry) => {
    track('history_remove_entry', { type: entry.type, source: 'history_swipe' });
    removeHistoryEntry.mutate(entry, {
      onSuccess: () => {
        setUndoCandidate(entry);
        setShowUndoHint(true);
      },
    });
  };

  useShakeToUndo(() => {
    if (!undoCandidate) {
      return;
    }
    const entry = undoCandidate;
    setUndoCandidate(null);
    setShowUndoHint(false);
    track('history_remove_undo', { type: entry.type, method: 'shake' });
    restoreHistoryEntry.mutate(entry);
  }, undoCandidate !== null);

  useClearAllHeaderAction({
    navigation,
    visible: hasHistory,
    strings: strings.history,
    clickEvent: 'history_click_clear_all',
    confirmEvent: 'history_clear_all_confirm',
    onConfirm: () => clearHistory.mutate(),
    sortDirection: historySortDirection,
    onSortDirectionChange: (direction) => {
      track('history_change_sort', { direction });
      void updatePreference('historySortDirection', direction);
    },
  });

  const content =
    !isLoading && (!data || data.length === 0) ? (
      <EmptyState
        icon="time-outline"
        title={strings.history.emptyTitle}
        description={strings.history.emptyDescription}
      />
    ) : (
      <FlatList
        data={entries}
        keyExtractor={getHistoryEntryId}
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
          const itemId = getHistoryEntryId(item);
          return (
            <SwipeToDeleteRow
              deleteAccessibilityLabel={strings.history.deleteAccessibilityLabel}
              deleteLabel={strings.history.deleteAction}
              isFirst={isFirst}
              isLast={isLast}
              isOpen={openItemId === itemId}
              itemId={itemId}
              onClose={(closedItemId) => {
                setOpenItemId((current) => (current === closedItemId ? null : current));
              }}
              onDelete={() => handleRemove(item)}
              onOpen={setOpenItemId}
            >
              <Pressable
                accessibilityRole="button"
                android_ripple={{ color: colors.rowPressed }}
                onPress={() => openEntry(item)}
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
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
                    {strings.history.viewedOn(formatDateTime(item.viewedAt))}
                  </Text>
                </View>
                <Ionicons color={colors.inkMuted} name="chevron-forward" size={16} />
              </Pressable>
            </SwipeToDeleteRow>
          );
        }}
      />
    );

  return (
    <View style={styles.container}>
      {content}
      <Snackbar
        duration={Snackbar.DURATION_LONG}
        onDismiss={() => {
          setShowUndoHint(false);
          setUndoCandidate(null);
        }}
        visible={showUndoHint}
        wrapperStyle={{ bottom: tabBarHeight }}
      >
        {strings.history.deletedUndoHint}
      </Snackbar>
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
  });
