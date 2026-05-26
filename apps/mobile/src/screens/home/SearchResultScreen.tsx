import Ionicons from '@expo/vector-icons/Ionicons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useEffect, useLayoutEffect, useMemo } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { track } from '../../analytics';
import {
  useAddFavourite,
  useFavourites,
  useIsFavourite,
  useRemoveFavourite,
} from '../../api/favourites';
import { useAddHistoryEntry } from '../../api/history';
import { useIsbnLookup, useTitleSearch } from '../../api/queries';
import { EmptyState } from '../../components/EmptyState';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { PriceTag } from '../../components/PriceTag';
import { strings } from '../../i18n/strings';
import { openExternalUrl } from '../../lib/linking';
import { usePreferences } from '../../lib/preferences';
import { spacing } from '../../theme/spacing';
import { useTheme } from '../../theme/ThemeProvider';
import { typography } from '../../theme/typography';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BookOffer } from '@bookscompare/contracts';
import type { ThemeColors } from '../../theme/colors';
import type { SearchResultRoutes } from '../../navigation/types';

type Props = NativeStackScreenProps<SearchResultRoutes, 'SearchResult'>;

function isEbookOffer(item: BookOffer): boolean {
  return item.productType.includes('電子書') || item.title.includes('電子書');
}

export function SearchResultScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const tabBarHeight = useBottomTabBarHeight();
  const { openLinksIn } = usePreferences();
  const isbnParam = 'isbn' in route.params ? route.params.isbn : '';
  const titleParam = 'title' in route.params ? route.params.title : '';
  const isbnQuery = useIsbnLookup(isbnParam);
  const titleQuery = useTitleSearch(titleParam);
  const data = isbnParam ? isbnQuery.data : titleQuery.data;
  const error = isbnParam ? isbnQuery.error : titleQuery.error;
  const isLoading = isbnParam ? isbnQuery.isLoading : titleQuery.isLoading;
  const isRefetching = isbnParam ? isbnQuery.isRefetching : titleQuery.isRefetching;
  const refetch = isbnParam ? isbnQuery.refetch : titleQuery.refetch;
  const offers = useMemo(() => {
    if (!data) {
      return [];
    }

    if ('book' in data) {
      return data.book ? data.book.offers : [];
    }

    return data.books.flatMap((book) => book.offers);
  }, [data]);
  const sources = data?.sources ?? [];
  const liveScraping = data?.meta.liveScraping ?? false;
  const resultCount = offers.length;
  const allSourcesErrored =
    sources.length > 0 && sources.every((source) => source.status === 'error');

  const isbnBookTitle = useMemo(() => {
    if (!isbnParam || !data || !('book' in data) || !data.book) {
      return '';
    }
    return data.book.title || data.book.offers[0]?.title || '';
  }, [isbnParam, data]);

  const { data: favourites } = useFavourites();
  const addFavourite = useAddFavourite();
  const removeFavourite = useRemoveFavourite();
  const isbnIsFavourite = useIsFavourite(isbnParam);
  const addHistoryEntry = useAddHistoryEntry();

  useEffect(() => {
    if (titleParam) {
      addHistoryEntry.mutate({ type: 'title', title: titleParam });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [titleParam]);

  useEffect(() => {
    if (!isbnParam || isLoading) {
      return;
    }
    addHistoryEntry.mutate({
      type: 'isbn',
      isbn: isbnParam,
      ...(isbnBookTitle ? { title: isbnBookTitle } : {}),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isbnParam, isbnBookTitle, isLoading]);

  useLayoutEffect(() => {
    if (!isbnParam || !isbnBookTitle) {
      navigation.setOptions({ headerRight: () => null });
      return;
    }

    navigation.setOptions({
      headerRight: () => (
        <Pressable
          accessibilityLabel={
            isbnIsFavourite
              ? strings.favourites.removeAccessibilityLabel
              : strings.favourites.addAccessibilityLabel
          }
          accessibilityRole="button"
          hitSlop={12}
          onPress={() => {
            if (isbnIsFavourite) {
              track('favourite_remove', { isbn: isbnParam, source: 'search_result_header' });
              removeFavourite.mutate(isbnParam);
            } else {
              track('favourite_add', { isbn: isbnParam, source: 'search_result_header' });
              addFavourite.mutate({ isbn: isbnParam, title: isbnBookTitle });
            }
          }}
          style={styles.headerFavouriteButton}
        >
          <Ionicons
            color={isbnIsFavourite ? colors.accent : colors.ink}
            name={isbnIsFavourite ? 'heart' : 'heart-outline'}
            size={24}
          />
        </Pressable>
      ),
    });
  }, [
    navigation,
    isbnParam,
    isbnBookTitle,
    isbnIsFavourite,
    addFavourite,
    removeFavourite,
    colors,
    styles,
  ]);

  const favouriteIsbnSet = useMemo(
    () => new Set((favourites ?? []).map((fav) => fav.isbn)),
    [favourites]
  );

  const toggleOfferFavourite = (item: BookOffer) => {
    if (!item.isbn) {
      return;
    }
    if (favouriteIsbnSet.has(item.isbn)) {
      track('favourite_remove', { isbn: item.isbn, source: 'search_result_row' });
      removeFavourite.mutate(item.isbn);
    } else {
      track('favourite_add', { isbn: item.isbn, source: 'search_result_row' });
      addFavourite.mutate({ isbn: item.isbn, title: item.title });
    }
  };

  const openOffer = (item: BookOffer) => {
    track('search_result_open_offer', {
      isbn: isbnParam,
      sourceId: item.sourceId,
    });
    if (openLinksIn === 'browser') {
      void openExternalUrl(item.url);
      return;
    }
    navigation.navigate('SearchWebView', {
      title: `${item.sourceName} - ${item.title}`,
      url: item.url,
      showOptions: true,
    });
  };

  const renderOffer = ({ item, index }: { item: BookOffer; index: number }) => {
    const showRowFavourite = !isbnParam && Boolean(item.isbn);
    const rowIsFavourite = showRowFavourite && item.isbn ? favouriteIsbnSet.has(item.isbn) : false;
    const isFirst = index === 0;
    const isLast = index === offers.length - 1;
    return (
      <Pressable
        android_ripple={{ color: colors.rowPressed }}
        onPress={() => openOffer(item)}
        style={({ pressed }) => [
          styles.row,
          isFirst && styles.rowFirst,
          isLast && styles.rowLast,
          pressed && styles.rowPressed,
        ]}
      >
        <Image
          source={item.imageUrl ? { uri: item.imageUrl } : undefined}
          style={styles.thumbnail}
          resizeMode="cover"
        />
        <View style={styles.body}>
          {isEbookOffer(item) ? (
            <View style={styles.ebookBadge}>
              <Text style={styles.ebookBadgeText}>{strings.searchResult.ebookBadge}</Text>
            </View>
          ) : null}
          <Text style={styles.title} numberOfLines={2}>
            {item.sourceName}: {item.title}
          </Text>
          {item.authors.length > 0 ? (
            <Text style={styles.note} numberOfLines={1}>
              {item.authors.join('、')}
            </Text>
          ) : null}
          {item.publisher ? (
            <Text style={styles.note} numberOfLines={1}>
              {item.publisher}
            </Text>
          ) : null}
        </View>
        <View style={styles.rowTrailing}>
          {showRowFavourite ? (
            <Pressable
              accessibilityLabel={
                rowIsFavourite
                  ? strings.favourites.removeAccessibilityLabel
                  : strings.favourites.addAccessibilityLabel
              }
              accessibilityRole="button"
              hitSlop={12}
              onPress={() => toggleOfferFavourite(item)}
              style={({ pressed }) => [
                styles.rowFavouriteButton,
                pressed && styles.rowFavouritePressed,
              ]}
            >
              <Ionicons
                color={rowIsFavourite ? colors.accent : colors.inkMuted}
                name={rowIsFavourite ? 'heart' : 'heart-outline'}
                size={22}
              />
            </Pressable>
          ) : null}
          <PriceTag
            currency={item.currency}
            price={item.price}
            {...(item.discountRate ? { discountRate: item.discountRate } : {})}
          />
        </View>
      </Pressable>
    );
  };

  if (error) {
    return (
      <EmptyState
        icon="cloud-offline-outline"
        title={strings.searchResult.networkErrorTitle}
        description={strings.searchResult.networkErrorDescription}
        actionLabel={strings.searchResult.retryAction}
        onAction={() => void refetch()}
        containerStyle={styles.container}
      />
    );
  }

  if (!isLoading && resultCount === 0) {
    if (allSourcesErrored) {
      return (
        <View style={styles.container}>
          <EmptyState
            icon="cloud-offline-outline"
            title={strings.searchResult.allErroredTitle}
            description={strings.searchResult.allErroredDescription}
            actionLabel={strings.searchResult.retryAction}
            onAction={() => void refetch()}
          />
        </View>
      );
    }

    if (!liveScraping) {
      return (
        <View style={styles.container}>
          <EmptyState
            icon="construct-outline"
            title={strings.searchResult.notLiveTitle}
            description={strings.searchResult.notLiveDescription}
            actionLabel={strings.searchResult.retryAction}
            onAction={() => void refetch()}
          />
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <EmptyState
          icon="sad-outline"
          title={strings.searchResult.notFoundTitle}
          description={strings.searchResult.notFoundDescription}
        />
      </View>
    );
  }

  const listHeader =
    resultCount > 0 ? (
      <Text style={styles.sectionHeader}>{strings.searchResult.resultsCount(resultCount)}</Text>
    ) : null;

  return (
    <View style={styles.container}>
      <FlatList
        data={offers}
        style={styles.list}
        contentContainerStyle={[styles.listContent, { paddingBottom: tabBarHeight + spacing.xl }]}
        contentInsetAdjustmentBehavior="automatic"
        keyExtractor={(item) => `${item.sourceId}:${item.sourceProductId}:${item.url}`}
        ListHeaderComponent={listHeader}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        onRefresh={() => void refetch()}
        refreshing={isRefetching}
        renderItem={renderOffer}
      />
      {isLoading ? <LoadingOverlay label={strings.searchResult.loadingLabel} /> : null}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.groupedBackground,
    },
    headerFavouriteButton: {
      alignItems: 'center',
      justifyContent: 'center',
      height: 32,
      width: 32,
    },
    list: {
      flex: 1,
      width: '100%',
    },
    listContent: {
      paddingHorizontal: spacing.md,
    },
    sectionHeader: {
      ...typography.footnote,
      color: colors.inkMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      paddingTop: spacing.md,
      paddingBottom: spacing.xs,
      paddingHorizontal: spacing.xs,
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.divider,
      marginLeft: 64 + spacing.sm + spacing.md,
    },
    row: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
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
    thumbnail: {
      width: 64,
      height: 80,
      borderRadius: 6,
      backgroundColor: colors.groupedBackground,
    },
    body: {
      flex: 1,
      gap: spacing.xxs,
    },
    rowTrailing: {
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: spacing.xs,
      alignSelf: 'stretch',
    },
    rowFavouriteButton: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowFavouritePressed: {
      opacity: 0.6,
    },
    ebookBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.xs,
      paddingVertical: 2,
      borderRadius: 10,
      backgroundColor: colors.highlightSoft,
    },
    ebookBadgeText: {
      ...typography.caption2,
      color: colors.inkMuted,
      fontWeight: '600',
    },
    title: {
      ...typography.subhead,
      color: colors.ink,
      fontWeight: '500',
    },
    note: {
      ...typography.footnote,
      color: colors.inkMuted,
    },
  });
