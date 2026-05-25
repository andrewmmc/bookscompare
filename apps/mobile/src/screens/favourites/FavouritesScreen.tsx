import Ionicons from '@expo/vector-icons/Ionicons';
import { useRef } from 'react';
import { Animated, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Text } from 'react-native-paper';

import { track } from '../../analytics';
import { useFavourites, useRemoveFavourite } from '../../api/favourites';
import { EmptyState } from '../../components/EmptyState';
import { activeLocale, strings } from '../../i18n/strings';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Favourite } from '../../lib/favourites';
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
  const { data, isLoading } = useFavourites();
  const removeFavourite = useRemoveFavourite();
  const swipeableRefs = useRef(new Map<string, Swipeable | null>());

  const openBook = (item: Favourite) => {
    track('favourites_open_book', { isbn: item.isbn });
    navigation.navigate('SearchResult', { isbn: item.isbn });
  };

  const handleRemove = (item: Favourite) => {
    track('favourite_remove', { isbn: item.isbn, source: 'favourites_swipe' });
    removeFavourite.mutate(item.isbn);
  };

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    _drag: Animated.AnimatedInterpolation<number>,
    item: Favourite
  ) => {
    const translateX = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [96, 0],
    });
    return (
      <Animated.View style={[styles.removeContainer, { transform: [{ translateX }] }]}>
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
        data={data ?? []}
        keyExtractor={(item) => item.isbn}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <Swipeable
            ref={(ref) => {
              swipeableRefs.current.set(item.isbn, ref);
            }}
            renderRightActions={(progress, drag) => renderRightActions(progress, drag, item)}
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
              android_ripple={{ color: colors.highlightSoft }}
              onPress={() => openBook(item)}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            >
              <View style={styles.iconWrap}>
                <Ionicons color={colors.accent} name="heart" size={20} />
              </View>
              <View style={styles.body}>
                <Text style={styles.title} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.meta}>{item.isbn}</Text>
                <Text style={styles.meta}>
                  {strings.favourites.addedOn(formatAddedOn(item.addedAt))}
                </Text>
              </View>
              <Ionicons color={colors.divider} name="chevron-forward" size={20} />
            </Pressable>
          </Swipeable>
        )}
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  rowPressed: {
    backgroundColor: colors.highlightSoft,
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
  removeContainer: {
    width: 96,
  },
  removeButton: {
    flex: 1,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs,
  },
  removeButtonPressed: {
    opacity: 0.85,
  },
  removeText: {
    ...typography.caption,
    color: '#ffffff',
    fontWeight: '600',
  },
});
