import Ionicons from '@expo/vector-icons/Ionicons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useLayoutEffect, useMemo, useRef } from 'react';
import { Alert, Animated, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

import { track } from '../../analytics';
import { useClearFavourites, useFavourites, useRemoveFavourite } from '../../api/favourites';
import { EmptyState } from '../../components/EmptyState';
import { activeLocale, strings } from '../../i18n/strings';
import { spacing } from '../../theme/spacing';
import { useTheme } from '../../theme/ThemeProvider';
import { typography } from '../../theme/typography';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Favourite } from '../../lib/favourites';
import type { ThemeColors } from '../../theme/colors';
import type { FavouritesStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<FavouritesStackParamList, 'Favourites'>;

const dateFormatter = new Intl.DateTimeFormat(activeLocale, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

function formatAddedOn(addedAt: number): string {
  try {
    return dateFormatter.format(new Date(addedAt));
  } catch {
    return new Date(addedAt).toISOString().slice(0, 10);
  }
}

export function FavouritesScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const tabBarHeight = useBottomTabBarHeight();
  const { data, isLoading } = useFavourites();
  const removeFavourite = useRemoveFavourite();
  const clearFavourites = useClearFavourites();
  const swipeableRefs = useRef(new Map<string, Swipeable | null>());

  const hasFavourites = (data?.length ?? 0) > 0;
  const entries = data ?? [];

  const openBook = (item: Favourite) => {
    track('favourites_open_book', { isbn: item.isbn });
    navigation.navigate('SearchResult', { isbn: item.isbn });
  };

  const handleRemove = (item: Favourite) => {
    track('favourite_remove', { isbn: item.isbn, source: 'favourites_swipe' });
    removeFavourite.mutate(item.isbn);
  };

  const handleClearAll = () => {
    track('favourites_click_clear_all');
    Alert.alert(
      strings.favourites.clearAllConfirmTitle,
      strings.favourites.clearAllConfirmMessage,
      [
        { text: strings.favourites.cancelAction, style: 'cancel' },
        {
          text: strings.favourites.clearAllConfirmAction,
          style: 'destructive',
          onPress: () => {
            track('favourites_clear_all_confirm');
            clearFavourites.mutate();
          },
        },
      ]
    );
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        hasFavourites ? (
          <Pressable
            accessibilityLabel={strings.favourites.clearAllAction}
            accessibilityRole="button"
            hitSlop={8}
            onPress={handleClearAll}
            style={({ pressed }) => [styles.headerAction, pressed && styles.headerActionPressed]}
          >
            <Text style={styles.headerActionText}>{strings.favourites.clearAllAction}</Text>
          </Pressable>
        ) : null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, hasFavourites]);

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    _drag: Animated.AnimatedInterpolation<number>,
    item: Favourite,
    isLast: boolean
  ) => {
    const translateX = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [96, 0],
    });
    return (
      <Animated.View
        style={[
          styles.removeContainer,
          isLast && styles.removeContainerLast,
          { transform: [{ translateX }] },
        ]}
      >
        <Pressable
          accessibilityLabel={strings.favourites.removeAccessibilityLabel}
          accessibilityRole="button"
          android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
          onPress={() => handleRemove(item)}
          style={({ pressed }) => [styles.removeButton, pressed && styles.removeButtonPressed]}
        >
          <Ionicons color="#ffffff" name="trash" size={20} />
          <Text style={styles.removeText}>{strings.favourites.removeAction}</Text>
        </Pressable>
      </Animated.View>
    );
  };

  if (!isLoading && (!data || data.length === 0)) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="heart-outline"
          title={strings.favourites.emptyTitle}
          description={strings.favourites.emptyDescription}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
            <View style={[styles.swipeShell, isFirst && styles.rowFirst, isLast && styles.rowLast]}>
              <Swipeable
                ref={(ref) => {
                  swipeableRefs.current.set(item.isbn, ref);
                }}
                renderRightActions={(progress, drag) =>
                  renderRightActions(progress, drag, item, isLast)
                }
                onSwipeableOpen={() => {
                  swipeableRefs.current.forEach((ref, key) => {
                    if (key !== item.isbn) {
                      ref?.close();
                    }
                  });
                }}
                overshootRight={false}
                rightThreshold={40}
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
                      {strings.history.isbnLabel(item.isbn)}
                    </Text>
                    <Text style={styles.meta} numberOfLines={1}>
                      {strings.favourites.addedOn(formatAddedOn(item.addedAt))}
                    </Text>
                  </View>
                  <Ionicons color={colors.inkMuted} name="chevron-forward" size={16} />
                </Pressable>
              </Swipeable>
            </View>
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
    swipeShell: {
      backgroundColor: colors.surface,
      overflow: 'hidden',
    },
    rowFirst: {
      borderTopLeftRadius: 14,
      borderTopRightRadius: 14,
    },
    rowLast: {
      borderBottomLeftRadius: 14,
      borderBottomRightRadius: 14,
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
    removeContainer: {
      width: 96,
      backgroundColor: colors.danger,
    },
    removeContainerLast: {
      borderBottomRightRadius: 14,
    },
    removeButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xxs,
    },
    removeButtonPressed: {
      opacity: 0.85,
    },
    removeText: {
      ...typography.footnote,
      color: '#ffffff',
      fontWeight: '600',
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
