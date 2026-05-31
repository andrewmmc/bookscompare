import Ionicons from '@expo/vector-icons/Ionicons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
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
import type {
  BookDetailResponse,
  BookOffer,
  SearchResponse,
  SourceState,
} from '@bookscompare/contracts';
import type { BookTypePreference } from '../../lib/preferences';
import type { ThemeColors } from '../../theme/colors';
import type { SearchResultRoutes } from '../../navigation/types';

type Props = NativeStackScreenProps<SearchResultRoutes, 'SearchResult'>;
type SearchResultData = BookDetailResponse | SearchResponse;

function isEbookOffer(item: BookOffer): boolean {
  return item.productType.includes('電子書') || item.title.includes('電子書');
}

function matchesBookTypePreference(
  item: BookOffer,
  preferredBookTypes: BookTypePreference[]
): boolean {
  if (preferredBookTypes.length === 0) {
    return true;
  }

  const isEbook = isEbookOffer(item);
  return preferredBookTypes.includes(isEbook ? 'ebook' : 'physical');
}

function extractOffers(data: SearchResultData | undefined): BookOffer[] {
  if (!data) {
    return [];
  }

  if ('book' in data) {
    return data.book ? data.book.offers : [];
  }

  return data.books.flatMap((book) => book.offers);
}

function filterOffers(
  offers: BookOffer[],
  preferredSources: Set<string>,
  preferredBookTypes: BookTypePreference[]
): BookOffer[] {
  return offers
    .filter(
      (offer) =>
        (preferredSources.size === 0 || preferredSources.has(offer.sourceId)) &&
        matchesBookTypePreference(offer, preferredBookTypes)
    )
    .sort((a, b) => a.price - b.price);
}

function allSourcesErrored(sources: SourceState[]): boolean {
  return sources.length > 0 && sources.every((source) => source.status === 'error');
}

interface OfferRowProps {
  item: BookOffer;
  index: number;
  totalCount: number;
  isbnParam: string;
  lowestPrice: number | null;
  favouriteIsbnSet: Set<string>;
  colors: ThemeColors;
  styles: ReturnType<typeof createStyles>;
  onOpen: (item: BookOffer) => void;
  onToggleFavourite: (item: BookOffer) => void;
}

function OfferRow({
  item,
  index,
  totalCount,
  isbnParam,
  lowestPrice,
  favouriteIsbnSet,
  colors,
  styles,
  onOpen,
  onToggleFavourite,
}: OfferRowProps) {
  const showRowFavourite = !isbnParam && Boolean(item.isbn);
  const rowIsFavourite = showRowFavourite && item.isbn ? favouriteIsbnSet.has(item.isbn) : false;
  const showLowestBadge = totalCount > 1 && lowestPrice !== null && item.price === lowestPrice;
  const isFirst = index === 0;
  const isLast = index === totalCount - 1;

  return (
    <Pressable
      android_ripple={{ color: colors.rowPressed }}
      onPress={() => onOpen(item)}
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
        {showLowestBadge || isEbookOffer(item) ? (
          <View style={styles.badgeRow}>
            {showLowestBadge ? (
              <View style={styles.lowestBadge}>
                <Ionicons name="pricetag" size={11} color={colors.surface} />
                <Text style={styles.lowestBadgeText}>{strings.searchResult.lowestPriceBadge}</Text>
              </View>
            ) : null}
            {isEbookOffer(item) ? (
              <View style={styles.ebookBadge}>
                <Text style={styles.ebookBadgeText}>{strings.searchResult.ebookBadge}</Text>
              </View>
            ) : null}
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
            onPress={() => onToggleFavourite(item)}
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
}

export function SearchResultScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const tabBarHeight = useBottomTabBarHeight();
  const { openLinksIn, preferredSources, preferredBookTypes } = usePreferences();
  const isbnParam = 'isbn' in route.params ? route.params.isbn : '';
  const titleParam = 'title' in route.params ? route.params.title : '';
  const isbnQuery = useIsbnLookup(isbnParam);
  const titleQuery = useTitleSearch(titleParam);
  const data = isbnParam ? isbnQuery.data : titleQuery.data;
  const error = isbnParam ? isbnQuery.error : titleQuery.error;
  const isLoading = isbnParam ? isbnQuery.isLoading : titleQuery.isLoading;
  const isRefetching = isbnParam ? isbnQuery.isRefetching : titleQuery.isRefetching;
  const refetch = isbnParam ? isbnQuery.refetch : titleQuery.refetch;
  const preferredSet = useMemo(() => new Set(preferredSources), [preferredSources]);
  const rawOffers = useMemo(() => extractOffers(data), [data]);
  const offers = useMemo(
    () => filterOffers(rawOffers, preferredSet, preferredBookTypes),
    [rawOffers, preferredBookTypes, preferredSet]
  );
  const sources = data?.sources ?? [];
  const liveScraping = data?.meta.liveScraping ?? false;
  const resultCount = offers.length;
  const lowestPrice = resultCount > 0 ? offers[0]!.price : null;
  const hasFilteredEverything = rawOffers.length > 0 && resultCount === 0;
  const sourcesErrored = allSourcesErrored(sources);

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
  const { mutate: addHistoryEntry } = useAddHistoryEntry();
  const trackedSearchState = useRef<string | null>(null);
  const recordedTitleHistory = useRef<string | null>(null);
  const recordedIsbnHistory = useRef<string | null>(null);

  useEffect(() => {
    if (!titleParam || recordedTitleHistory.current === titleParam) {
      return;
    }

    recordedTitleHistory.current = titleParam;
    addHistoryEntry({ type: 'title', title: titleParam });
  }, [titleParam, addHistoryEntry]);

  useEffect(() => {
    if (isLoading) {
      return;
    }
    const searchType = isbnParam ? 'isbn' : 'title';
    const searchState = error
      ? `${searchType}:error`
      : data
        ? `${searchType}:${resultCount > 0 ? 'loaded' : 'empty'}:${resultCount}`
        : `${searchType}:idle`;

    if (trackedSearchState.current === searchState) {
      return;
    }

    trackedSearchState.current = searchState;

    if (error) {
      track('search_result_error', { searchType });
    } else if (data) {
      if (resultCount > 0) {
        track('search_result_loaded', { searchType, resultCount });
      } else {
        track('search_result_empty', { searchType });
      }
    }
  }, [isLoading, error, data, resultCount, isbnParam]);

  useEffect(() => {
    if (!isbnParam || isLoading) {
      return;
    }

    const historyKey = `${isbnParam}:${isbnBookTitle}`;

    if (recordedIsbnHistory.current === historyKey) {
      return;
    }

    recordedIsbnHistory.current = historyKey;
    addHistoryEntry({
      type: 'isbn',
      isbn: isbnParam,
      ...(isbnBookTitle ? { title: isbnBookTitle } : {}),
    });
  }, [isbnParam, isbnBookTitle, isLoading, addHistoryEntry]);

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

  const renderOffer = ({ item, index }: { item: BookOffer; index: number }) => (
    <OfferRow
      item={item}
      index={index}
      totalCount={offers.length}
      isbnParam={isbnParam}
      lowestPrice={lowestPrice}
      favouriteIsbnSet={favouriteIsbnSet}
      colors={colors}
      styles={styles}
      onOpen={openOffer}
      onToggleFavourite={toggleOfferFavourite}
    />
  );

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
    if (hasFilteredEverything) {
      return (
        <View style={styles.container}>
          <EmptyState
            icon="funnel-outline"
            title={strings.searchResult.filteredEmptyTitle}
            description={strings.searchResult.filteredEmptyDescription}
          />
        </View>
      );
    }

    if (sourcesErrored) {
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
      height: 36,
      width: 36,
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
      borderRadius: 16,
      backgroundColor: colors.controlBackground,
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
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: spacing.xxs,
    },
    lowestBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.xs,
      paddingVertical: 2,
      borderRadius: 10,
      backgroundColor: colors.accent,
    },
    lowestBadgeText: {
      ...typography.caption2,
      color: colors.surface,
      fontWeight: '700',
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
