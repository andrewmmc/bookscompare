import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { track } from '../../analytics';
import { useBookDetail, type BookDetailParams } from '../../api/queries';
import { strings } from '../../i18n/strings';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { EmptyState } from '../../components/EmptyState';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { PriceTag } from '../../components/PriceTag';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BookOffer } from '@bookscompare/contracts';
import type { HomeStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'BookDetail'>;

const SUMMARY_PREVIEW_CHARS = 180;

function isbnFromParams(params: BookDetailParams): string | undefined {
  return 'isbn' in params ? params.isbn : undefined;
}

export function BookDetailScreen({ navigation, route }: Props) {
  const params = route.params;
  const { data, error, isLoading, isRefetching, refetch } = useBookDetail(params);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);

  const book = data?.book ?? null;
  const sources = data?.sources ?? [];
  const offers = book?.offers ?? [];
  const liveScraping = data?.meta.liveScraping ?? false;
  const allSourcesErrored =
    sources.length > 0 && sources.every((source) => source.status === 'error');

  const openOffer = (offer: BookOffer) => {
    track('book_detail_open_offer', {
      bookId: book?.id,
      sourceId: offer.sourceId,
      ...(isbnFromParams(params) ? { isbn: isbnFromParams(params) } : {}),
    });
    navigation.navigate('SearchWebView', {
      title: `${offer.sourceName} - ${offer.title}`,
      url: offer.url,
      showOptions: true,
    });
  };

  if (error) {
    return (
      <EmptyState
        icon="sad"
        title={strings.bookDetail.networkErrorTitle}
        description={strings.bookDetail.networkErrorDescription}
        actionLabel={strings.bookDetail.retryAction}
        onAction={() => void refetch()}
        containerStyle={styles.container}
      />
    );
  }

  if (!isLoading && !book) {
    if (allSourcesErrored) {
      return (
        <View style={styles.container}>
          <EmptyState
            icon="cloud-offline"
            title={strings.searchResult.allErroredTitle}
            description={strings.searchResult.allErroredDescription}
            actionLabel={strings.bookDetail.retryAction}
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
            actionLabel={strings.bookDetail.retryAction}
            onAction={() => void refetch()}
          />
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <EmptyState
          icon="sad"
          title={strings.bookDetail.notFoundTitle}
          description={strings.bookDetail.notFoundDescription}
        />
      </View>
    );
  }

  if (!book) {
    return <LoadingOverlay label={strings.bookDetail.loadingLabel} />;
  }

  const summary = book.summary?.trim() ?? '';
  const isSummaryLong = summary.length > SUMMARY_PREVIEW_CHARS;
  const visibleSummary =
    isSummaryLong && !isSummaryExpanded ? `${summary.slice(0, SUMMARY_PREVIEW_CHARS)}…` : summary;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={undefined}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Image
            source={book.imageUrl ? { uri: book.imageUrl } : undefined}
            style={styles.cover}
            resizeMode="cover"
          />
          <View style={styles.headerBody}>
            <Text style={styles.title}>{book.title}</Text>
            {book.authors.length > 0 ? (
              <Text style={styles.headerNote}>{book.authors.join('、')}</Text>
            ) : null}
            {book.publisher ? <Text style={styles.headerNote}>{book.publisher}</Text> : null}
            {book.publicationDate ? (
              <Text style={styles.headerNote}>{book.publicationDate}</Text>
            ) : null}
            {book.isbn ? <Text style={styles.headerNote}>ISBN {book.isbn}</Text> : null}
          </View>
        </View>

        {summary ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{strings.bookDetail.descriptionTitle}</Text>
            <Text style={styles.summaryText}>{visibleSummary}</Text>
            {isSummaryLong ? (
              <Pressable
                onPress={() => setIsSummaryExpanded((value) => !value)}
                style={({ pressed }) => [
                  styles.expandButton,
                  pressed && styles.expandButtonPressed,
                ]}
              >
                <Text style={styles.expandButtonText}>
                  {isSummaryExpanded ? strings.bookDetail.showLess : strings.bookDetail.showMore}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{strings.bookDetail.pricesTitle}</Text>
          {offers.map((offer) => (
            <Pressable
              key={`${offer.sourceId}:${offer.sourceProductId}`}
              android_ripple={{ color: colors.highlightSoft }}
              onPress={() => openOffer(offer)}
              style={({ pressed }) => [styles.offerRow, pressed && styles.offerRowPressed]}
            >
              <View style={styles.offerBody}>
                {offer.productType === '電子書' ? (
                  <View style={styles.ebookBadge}>
                    <Text style={styles.ebookBadgeText}>{strings.bookDetail.ebookBadge}</Text>
                  </View>
                ) : null}
                <Text style={styles.offerSource}>{offer.sourceName}</Text>
                {offer.badges.length > 0 ? (
                  <Text style={styles.offerBadges} numberOfLines={1}>
                    {offer.badges.join(' · ')}
                  </Text>
                ) : null}
              </View>
              <PriceTag
                currency={offer.currency}
                price={offer.price}
                {...(offer.discountRate ? { discountRate: offer.discountRate } : {})}
              />
            </Pressable>
          ))}
        </View>
      </ScrollView>
      {isLoading || isRefetching ? (
        <LoadingOverlay label={strings.bookDetail.loadingLabel} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.surface,
    gap: spacing.md,
  },
  cover: {
    width: 120,
    height: 160,
    backgroundColor: colors.border,
  },
  headerBody: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    ...typography.sectionTitle,
    color: colors.ink,
  },
  headerNote: {
    ...typography.caption,
    color: colors.inkMuted,
  },
  section: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    ...typography.caption,
    color: colors.inkMuted,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryText: {
    ...typography.body,
    color: colors.ink,
    lineHeight: 22,
  },
  expandButton: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  expandButtonPressed: {
    opacity: 0.6,
  },
  expandButtonText: {
    ...typography.body,
    color: colors.accent,
    fontWeight: '600',
  },
  offerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  offerRowPressed: {
    backgroundColor: colors.highlightSoft,
  },
  offerBody: {
    flex: 1,
    gap: spacing.xxs,
  },
  offerSource: {
    ...typography.body,
    color: colors.ink,
  },
  offerBadges: {
    ...typography.caption,
    color: colors.inkMuted,
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
});
