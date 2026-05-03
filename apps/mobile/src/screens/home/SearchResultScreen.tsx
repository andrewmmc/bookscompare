import { useMemo } from 'react';
import { FlatList, Image, Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { track } from '../../analytics';
import { useIsbnLookup, useTitleSearch } from '../../api/queries';
import { strings } from '../../i18n/strings';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { EmptyState } from '../../components/EmptyState';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { PriceTag } from '../../components/PriceTag';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BookOffer, SourceState } from '@bookscompare/contracts';
import type { HomeStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'SearchResult'>;

const sourceStatusLabels: Record<SourceState['status'], string> = {
  ready: strings.searchResult.sourceStatus.ready,
  error: strings.searchResult.sourceStatus.error,
  disabled: strings.searchResult.sourceStatus.disabled,
};

const sourceStatusStyles: Record<SourceState['status'], { bg: string; fg: string }> = {
  ready: { bg: colors.highlightSoft, fg: colors.ink },
  error: { bg: '#fde2dd', fg: colors.danger },
  disabled: { bg: colors.border, fg: colors.inkMuted },
};

export function SearchResultScreen({ navigation, route }: Props) {
  const isbnParam = 'isbn' in route.params ? route.params.isbn : '';
  const titleParam = 'title' in route.params ? route.params.title : '';
  const isbnQuery = useIsbnLookup(isbnParam);
  const titleQuery = useTitleSearch(titleParam);
  const { data, error, isLoading, isRefetching, refetch } = isbnParam ? isbnQuery : titleQuery;
  const offers = useMemo(
    () => [...(data?.data ?? [])].sort((left, right) => left.price - right.price),
    [data?.data]
  );
  const sources = data?.sources ?? [];
  const liveScraping = data?.meta.liveScraping ?? false;
  const allSourcesErrored = sources.length > 0 && sources.every((s) => s.status === 'error');

  const openOffer = (item: BookOffer) => {
    track('search_result_open_offer', {
      ...(isbnParam ? { isbn: isbnParam } : { title: titleParam }),
      sourceId: item.sourceId,
    });
    navigation.navigate('SearchWebView', {
      title: `${item.sourceName} - ${item.title}`,
      url: item.url,
      showOptions: true,
    });
  };

  const renderSourceChips = () => {
    if (sources.length === 0) {
      return null;
    }

    return (
      <View
        style={styles.chipsRow}
        accessibilityLabel={strings.searchResult.sourceChipsAccessibilityLabel}
      >
        {sources.map((source) => {
          const palette = sourceStatusStyles[source.status];
          return (
            <View
              key={source.id}
              style={[styles.chip, { backgroundColor: palette.bg }]}
              accessibilityLabel={`${source.name} ${sourceStatusLabels[source.status]}`}
            >
              <Text style={[styles.chipText, { color: palette.fg }]} numberOfLines={1}>
                {source.name} · {sourceStatusLabels[source.status]}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

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

  if (!isLoading && offers.length === 0) {
    if (allSourcesErrored) {
      return (
        <View style={styles.container}>
          {renderSourceChips()}
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
          {renderSourceChips()}
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
        {renderSourceChips()}
        <EmptyState
          icon="sad"
          title={strings.searchResult.notFoundTitle}
          description={strings.searchResult.notFoundDescription}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={offers}
        keyExtractor={(item) => `${item.sourceId}:${item.sourceProductId}`}
        ListHeaderComponent={
          <View>
            {renderSourceChips()}
            {offers.length > 0 ? (
              <View style={styles.divider}>
                <Text style={styles.dividerText}>
                  {strings.searchResult.resultsCount(offers.length)}
                </Text>
              </View>
            ) : null}
          </View>
        }
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
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: 999,
  },
  chipText: {
    ...typography.caption,
    fontSize: 12,
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
    marginLeft: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
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
    flex: 1,
  },
  note: {
    ...typography.caption,
    color: colors.inkMuted,
  },
});
