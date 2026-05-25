import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useLayoutEffect, useMemo } from 'react';
import { FlatList, Image, Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

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
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BookOffer } from '@bookscompare/contracts';
import type { SearchResultRoutes } from '../../navigation/types';

type Props = NativeStackScreenProps<SearchResultRoutes, 'SearchResult'>;

function isEbookOffer(item: BookOffer): boolean {
  return item.productType.includes('電子書') || item.title.includes('電子書');
}

export function SearchResultScreen({ navigation, route }: Props) {
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
  }, [navigation, isbnParam, isbnBookTitle, isbnIsFavourite, addFavourite, removeFavourite]);

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
    navigation.navigate('SearchWebView', {
      title: `${item.sourceName} - ${item.title}`,
      url: item.url,
      showOptions: true,
    });
  };

  const renderOffer = ({ item }: { item: BookOffer }) => {
    const showRowFavourite = !isbnParam && Boolean(item.isbn);
    const rowIsFavourite = showRowFavourite && item.isbn ? favouriteIsbnSet.has(item.isbn) : false;
    return (
      <Pressable
        android_ripple={{ color: colors.rowPressed }}
        onPress={() => openOffer(item)}
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
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
              hitSlop={8}
              onPress={() => toggleOfferFavourite(item)}
              style={styles.rowFavouriteButton}
            >
              <Ionicons
                color={rowIsFavourite ? colors.accent : colors.inkMuted}
                name={rowIsFavourite ? 'heart' : 'heart-outline'}
                size={20}
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
        icon="sad"
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
            icon="cloud-offline"
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
            icon="construct"
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
          icon="sad"
          title={strings.searchResult.notFoundTitle}
          description={strings.searchResult.notFoundDescription}
        />
      </View>
    );
  }

  const listHeader = (
    <View>
      {resultCount > 0 ? (
        <View style={styles.divider}>
          <Text style={styles.dividerText}>{strings.searchResult.resultsCount(resultCount)}</Text>
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={offers}
        style={styles.list}
        contentContainerStyle={styles.listContent}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
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
    paddingBottom: spacing.xl,
  },
  divider: {
    backgroundColor: colors.groupedBackground,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  dividerText: {
    ...typography.caption,
    color: colors.inkMuted,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
    marginLeft: spacing.md + 64 + spacing.sm,
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
  rowPressed: {
    backgroundColor: colors.rowPressed,
  },
  thumbnail: {
    width: 64,
    height: 80,
    backgroundColor: 'transparent',
  },
  body: {
    flex: 1,
    gap: spacing.xxs,
  },
  rowTrailing: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  rowFavouriteButton: {
    padding: spacing.xxs,
  },
  ebookBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
    borderRadius: 3,
    backgroundColor: colors.inkMuted,
  },
  ebookBadgeText: {
    ...typography.caption,
    color: '#ffffff',
    fontSize: 11,
    lineHeight: 14,
  },
  title: {
    ...typography.body,
    color: colors.ink,
  },
  note: {
    ...typography.caption,
    color: colors.inkMuted,
  },
});
