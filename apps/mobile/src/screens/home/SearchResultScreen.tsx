import { useMemo } from 'react';
import { FlatList, Image, Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { track } from '../../analytics';
import { useIsbnLookup, useTitleSearch } from '../../api/queries';
import { PriceTag } from '../../components/PriceTag';
import { featureFlags } from '../../config/featureFlags';
import { strings } from '../../i18n/strings';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { EmptyState } from '../../components/EmptyState';
import { LoadingOverlay } from '../../components/LoadingOverlay';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BookOffer, BookSummary } from '@bookscompare/contracts';
import type { HomeStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'SearchResult'>;

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
  const offers = useMemo(
    () =>
      isbnParam && data && 'book' in data
        ? [...(data.book?.offers ?? [])].sort((left, right) => left.price - right.price)
        : [],
    [data, isbnParam]
  );
  const books = !isbnParam && data && 'books' in data ? data.books : [];
  const sources = data?.sources ?? [];
  const liveScraping = data?.meta.liveScraping ?? false;
  const resultCount = isbnParam ? offers.length : books.length;
  const allSourcesErrored =
    sources.length > 0 && sources.every((source) => source.status === 'error');

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

  const openBook = (item: BookSummary) => {
    track('search_result_open_book', {
      title: titleParam,
      bookId: item.id,
      hasIsbn: Boolean(item.isbn),
    });

    if (item.isbn) {
      navigation.navigate(featureFlags.enableBookDetailScreen ? 'BookDetail' : 'SearchResult', {
        isbn: item.isbn,
      });
      return;
    }

    navigation.navigate('BookDetail', {
      title: item.title,
      ...(item.authors[0] ? { author: item.authors[0] } : {}),
    });
  };

  const renderBook = ({ item }: { item: BookSummary }) => (
    <Pressable
      android_ripple={{ color: colors.highlightSoft }}
      onPress={() => openBook(item)}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <Image
        source={item.imageUrl ? { uri: item.imageUrl } : undefined}
        style={styles.thumbnail}
        resizeMode="cover"
      />
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
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
        <View style={styles.meta}>
          {typeof item.lowestPrice === 'number' ? (
            <Text style={styles.price}>
              {strings.searchResult.fromPrice(
                `${item.currency} ${item.lowestPrice.toLocaleString('en-US')}`
              )}
            </Text>
          ) : null}
          <Text style={styles.note}>{strings.searchResult.storeCount(item.offerCount)}</Text>
        </View>
      </View>
    </Pressable>
  );

  const renderOffer = ({ item }: { item: BookOffer }) => (
    <Pressable
      android_ripple={{ color: colors.highlightSoft }}
      onPress={() => openOffer(item)}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <Image
        source={item.imageUrl ? { uri: item.imageUrl } : undefined}
        style={styles.thumbnail}
        resizeMode="cover"
      />
      <View style={styles.body}>
        {item.productType === '電子書' ? (
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
      <PriceTag
        currency={item.currency}
        price={item.price}
        {...(item.discountRate ? { discountRate: item.discountRate } : {})}
      />
    </Pressable>
  );

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

  if (isbnParam) {
    return (
      <View style={styles.container}>
        <FlatList
          data={offers}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          keyExtractor={(item) => `${item.sourceId}:${item.sourceProductId}`}
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

  return (
    <View style={styles.container}>
      <FlatList
        data={books}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={listHeader}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        onRefresh={() => void refetch()}
        refreshing={isRefetching}
        renderItem={renderBook}
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
  list: {
    flex: 1,
    width: '100%',
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  divider: {
    backgroundColor: colors.highlightSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  dividerText: {
    ...typography.caption,
    color: colors.ink,
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
    backgroundColor: colors.highlightSoft,
  },
  thumbnail: {
    width: 64,
    height: 80,
    backgroundColor: colors.border,
  },
  body: {
    flex: 1,
    gap: spacing.xxs,
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
  meta: {
    marginTop: spacing.xxs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  price: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: '600',
  },
});
