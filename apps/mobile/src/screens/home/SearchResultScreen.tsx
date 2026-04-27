import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { FlatList, Image, Pressable, StyleSheet, View } from 'react-native';
import { Chip, Surface, Text } from 'react-native-paper';

import { track } from '../../analytics';
import { useIsbnLookup } from '../../api/queries';
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

export function SearchResultScreen({ navigation, route }: Props) {
  const { data, error, isLoading, isRefetching, refetch } = useIsbnLookup(route.params.isbn);
  const offers = useMemo(
    () => [...(data?.data ?? [])].sort((left, right) => left.price - right.price),
    [data?.data]
  );

  const renderOffer = ({ item }: { item: BookOffer }) => (
    <Surface elevation={1} style={styles.offerCard}>
      <View style={styles.offerRow}>
        <Image source={{ uri: item.imageUrl }} style={styles.thumbnail} resizeMode="cover" />
        <View style={styles.offerBody}>
          <Text style={styles.offerSource}>{item.sourceName}</Text>
          <Text style={styles.offerTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.offerMeta} numberOfLines={1}>
            {item.authors.join('、') || '作者待補'}
          </Text>
          <Text style={styles.offerMeta} numberOfLines={1}>
            {item.publisher || '出版社待補'}
          </Text>
          <View style={styles.badgeRow}>
            {item.badges.slice(0, 3).map((badge) => (
              <Chip compact key={badge} style={styles.badge} textStyle={styles.badgeText}>
                {badge}
              </Chip>
            ))}
          </View>
        </View>
        <PriceTag currency={item.currency} price={item.priceText} />
      </View>
      <View style={styles.ctaRow}>
        <Text style={styles.ctaLabel}>查看店鋪頁面</Text>
        <Ionicons color={colors.accent} name="arrow-forward" size={18} />
      </View>
    </Surface>
  );

  if (error) {
    return (
      <EmptyState
        icon="cloud-offline"
        title="未能載入內容"
        description="請檢查您的網絡連接。如問題持續，稍後再試一次。"
        actionLabel="重新載入"
        onAction={() => void refetch()}
        containerStyle={styles.container}
      />
    );
  }

  if (!isLoading && offers.length === 0) {
    return (
      <View style={styles.container}>
        <ResultHeader
          isbn={route.params.isbn}
          message={data?.meta.message}
          liveScraping={data?.meta.liveScraping ?? false}
          sourceStates={data?.sources ?? []}
          total={offers.length}
        />
        <EmptyState
          icon="library"
          title="未能找到結果"
          description="抱歉，找不到所搜尋書本的價格資料。若你慣用的網絡書店尚未出現，歡迎之後再回來看看。"
          containerStyle={styles.emptyContainer}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={offers}
        keyExtractor={(item) => `${item.sourceId}:${item.sourceProductId}`}
        ListHeaderComponent={
          <ResultHeader
            isbn={route.params.isbn}
            message={data?.meta.message}
            liveScraping={data?.meta.liveScraping ?? false}
            sourceStates={data?.sources ?? []}
            total={offers.length}
          />
        }
        onRefresh={() => void refetch()}
        refreshing={isRefetching}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              track('search_result_open_offer', {
                isbn: route.params.isbn,
                sourceId: item.sourceId,
              });
              navigation.navigate('SearchWebView', {
                title: `${item.sourceName} - ${item.title}`,
                url: item.url,
                showOptions: true,
              });
            }}
          >
            {renderOffer({ item })}
          </Pressable>
        )}
      />
      {isLoading ? <LoadingOverlay label="正在比對最新書價…" /> : null}
    </View>
  );
}

interface ResultHeaderProps {
  isbn: string;
  total: number;
  liveScraping: boolean;
  message: string | undefined;
  sourceStates: SourceState[];
}

function ResultHeader({ isbn, total, liveScraping, message, sourceStates }: ResultHeaderProps) {
  return (
    <View style={styles.headerWrap}>
      <Surface elevation={1} style={styles.summaryCard}>
        <Text style={styles.summaryKicker}>搜尋 ISBN</Text>
        <Text style={styles.summaryTitle}>{isbn}</Text>
        <Text style={styles.summaryCopy}>共找到 {total} 個結果，已按價格由低至高排序。</Text>
      </Surface>

      {!liveScraping || message ? (
        <Surface elevation={0} style={styles.noticeCard}>
          <Ionicons color={colors.accentDeep} name="alert-circle" size={18} />
          <Text style={styles.noticeCopy}>{message ?? '暫時未能取得書本資料。'}</Text>
        </Surface>
      ) : null}

      <View style={styles.sourceWrap}>
        {sourceStates.map((source) => (
          <Chip
            key={source.id}
            compact
            style={[
              styles.sourceChip,
              source.status === 'ready'
                ? styles.sourceReady
                : source.status === 'error'
                  ? styles.sourceError
                  : styles.sourceDisabled,
            ]}
            textStyle={styles.sourceChipText}
          >
            {source.name}
          </Chip>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  emptyContainer: {
    flex: 1,
  },
  listContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  headerWrap: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  summaryCard: {
    borderRadius: 28,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    gap: spacing.xs,
  },
  summaryKicker: {
    ...typography.kicker,
    color: colors.accent,
  },
  summaryTitle: {
    ...typography.sectionTitle,
    color: colors.ink,
  },
  summaryCopy: {
    ...typography.body,
    color: colors.inkMuted,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#f6dece',
  },
  noticeCopy: {
    ...typography.caption,
    color: colors.accentDeep,
    flex: 1,
  },
  sourceWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  sourceChip: {
    borderRadius: 999,
  },
  sourceReady: {
    backgroundColor: '#dde9d9',
  },
  sourceError: {
    backgroundColor: '#f5d4cf',
  },
  sourceDisabled: {
    backgroundColor: colors.highlightSoft,
  },
  sourceChipText: {
    ...typography.caption,
    color: colors.ink,
  },
  offerCard: {
    borderRadius: 28,
    padding: spacing.md,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  offerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  thumbnail: {
    width: 76,
    height: 106,
    borderRadius: 18,
    backgroundColor: colors.highlightSoft,
  },
  offerBody: {
    flex: 1,
    gap: spacing.xxs,
  },
  offerSource: {
    ...typography.kicker,
    color: colors.accent,
  },
  offerTitle: {
    ...typography.body,
    fontFamily: typography.stackTitle.fontFamily,
    fontSize: 17,
    color: colors.ink,
  },
  offerMeta: {
    ...typography.caption,
    color: colors.inkMuted,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  badge: {
    backgroundColor: colors.highlightSoft,
  },
  badgeText: {
    ...typography.caption,
    color: colors.ink,
  },
  ctaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  ctaLabel: {
    ...typography.caption,
    color: colors.accent,
  },
});
