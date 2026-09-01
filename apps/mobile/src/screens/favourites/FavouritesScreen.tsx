import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Snackbar } from 'react-native-paper';

import { track } from '../../analytics';
import {
  useClearFavourites,
  useFavourites,
  useRemoveFavourite,
  useRestoreFavourite,
} from '../../api/favourites';
import { useClearAllHeaderAction } from '../../components/ClearAllHeaderButton';
import { EmptyState } from '../../components/EmptyState';
import { SwipeToDeleteRow } from '../../components/SwipeToDeleteRow';
import { useShakeToUndo } from '../../hooks/useShakeToUndo';
import { formatDateTime } from '../../lib/datetime';
import { updatePreference, usePreferences } from '../../lib/preferences';
import { spacing } from '../../theme/spacing';
import { useTheme } from '../../theme/ThemeProvider';
import { typography } from '../../theme/typography';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Favourite } from '../../lib/favourites';
import type { ThemeColors } from '../../theme/colors';
import type { FavouritesStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<FavouritesStackParamList, 'Favourites'>;

export function FavouritesScreen({ navigation }: Props) {
  const { t } = useTranslation('library');
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const tabBarHeight = useBottomTabBarHeight();
  const { data, isLoading } = useFavourites();
  const removeFavourite = useRemoveFavourite();
  const restoreFavourite = useRestoreFavourite();
  const clearFavourites = useClearFavourites();
  const { favouritesSortDirection = 'desc' } = usePreferences();
  const [openItemId, setOpenItemId] = useState<string | null>(null);
  const [undoCandidate, setUndoCandidate] = useState<Favourite | null>(null);
  const [showUndoHint, setShowUndoHint] = useState(false);
  const headerStrings = useMemo(
    () => ({
      clearAllAction: t('library:favourites.clearAllAction'),
      clearAllConfirmTitle: t('library:favourites.clearAllConfirmTitle'),
      clearAllConfirmMessage: t('library:favourites.clearAllConfirmMessage'),
      clearAllConfirmAction: t('library:favourites.clearAllConfirmAction'),
      cancelAction: t('library:favourites.cancelAction'),
      sortAction: t('library:favourites.sortAction'),
      newestFirstAction: t('library:favourites.newestFirstAction'),
      oldestFirstAction: t('library:favourites.oldestFirstAction'),
    }),
    [t]
  );

  const entries = useMemo(
    () =>
      (data ?? [])
        .slice()
        .sort((a, b) =>
          favouritesSortDirection === 'desc' ? b.addedAt - a.addedAt : a.addedAt - b.addedAt
        ),
    [favouritesSortDirection, data]
  );

  const openBook = (item: Favourite) => {
    track('favourites_open_book');
    navigation.navigate('SearchResult', { isbn: item.isbn });
  };

  const handleRemove = (item: Favourite) => {
    track('favourite_remove', { source: 'favourites_swipe' });
    removeFavourite.mutate(item.isbn, {
      onSuccess: () => {
        setUndoCandidate(item);
        setShowUndoHint(true);
      },
    });
  };

  useShakeToUndo(() => {
    if (!undoCandidate) {
      return;
    }
    const item = undoCandidate;
    setUndoCandidate(null);
    setShowUndoHint(false);
    track('favourite_remove_undo', { method: 'shake' });
    restoreFavourite.mutate(item);
  }, undoCandidate !== null);

  useClearAllHeaderAction({
    navigation,
    strings: headerStrings,
    clickEvent: 'favourites_click_clear_all',
    confirmEvent: 'favourites_clear_all_confirm',
    onConfirm: () => clearFavourites.mutate(),
    clearDisabled: !data?.length,
    sortDirection: favouritesSortDirection,
    onSortDirectionChange: (direction) => {
      track('favourites_change_sort', { direction });
      void updatePreference('favouritesSortDirection', direction);
    },
  });

  const content =
    !isLoading && (!data || data.length === 0) ? (
      <EmptyState
        icon="heart-outline"
        title={t('library:favourites.emptyTitle')}
        description={t('library:favourites.emptyDescription')}
      />
    ) : (
      <FlatList
        data={entries}
        keyExtractor={(item) => item.isbn}
        contentContainerStyle={[styles.listContent, { paddingBottom: tabBarHeight + spacing.xl }]}
        contentInsetAdjustmentBehavior="automatic"
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item, index }) => {
          const isFirst = index === 0;
          const isLast = index === entries.length - 1;
          return (
            <SwipeToDeleteRow
              deleteAccessibilityLabel={t('library:favourites.removeAccessibilityLabel')}
              deleteLabel={t('library:favourites.removeAction')}
              isFirst={isFirst}
              isLast={isLast}
              isOpen={openItemId === item.isbn}
              itemId={item.isbn}
              onClose={(itemId) => {
                setOpenItemId((current) => (current === itemId ? null : current));
              }}
              onDelete={() => handleRemove(item)}
              onOpen={setOpenItemId}
            >
              <Pressable
                accessibilityRole="button"
                android_ripple={{ color: colors.rowPressed }}
                onPress={() => openBook(item)}
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              >
                <View style={styles.iconTile}>
                  <Ionicons color="#ffffff" name="heart" size={16} />
                </View>
                <View style={styles.body}>
                  <Text style={styles.title} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={styles.isbn} numberOfLines={1}>
                    {t('library:history.isbnLabel', { isbn: item.isbn })}
                  </Text>
                  <Text style={styles.meta} numberOfLines={1}>
                    {t('library:favourites.addedOn', { dateText: formatDateTime(item.addedAt) })}
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
        {t('library:favourites.deletedUndoHint')}
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
      backgroundColor: colors.accent,
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
