import { FlatList, Image, Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { track } from '../../analytics';
import { useTitleSearch } from '../../api/queries';
import { strings } from '../../i18n/strings';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { EmptyState } from '../../components/EmptyState';
import { LoadingOverlay } from '../../components/LoadingOverlay';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BookSummary, SourceState } from '@bookscompare/contracts';
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
  const titleParam = route.params.title;
  const { data, error, isLoading, isRefetching, refetch } = useTitleSearch(titleParam);
  const books = data?.books ?? [];
  const sources = data?.sources ?? [];
  const liveScraping = data?.meta.liveScraping ?? false;
  const allSourcesErrored =
    sources.length > 0 && sources.every((source) => source.status === 'error');

  const openBook = (item: BookSummary) => {
    track('search_result_open_book', {
      title: titleParam,
      bookId: item.id,
      hasIsbn: Boolean(item.isbn),
    });

    if (item.isbn) {
      navigation.navigate('BookDetail', { isbn: item.isbn });
      return;
    }

    navigation.navigate('BookDetail', {
      title: item.title,
      ...(item.authors[0] ? { author: item.authors[0] } : {}),
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

  if (!isLoading && books.length === 0) {
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
        data={books}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View>
            {renderSourceChips()}
            {books.length > 0 ? (
              <View style={styles.divider}>
                <Text style={styles.dividerText}>
                  {strings.searchResult.resultsCount(books.length)}
                </Text>
              </View>
            ) : null}
          </View>
        }
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
