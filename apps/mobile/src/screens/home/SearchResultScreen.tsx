import { useMemo } from 'react';
import { FlatList, Image, Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { track } from '../../analytics';
import { useIsbnLookup } from '../../api/queries';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { EmptyState } from '../../components/EmptyState';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { PriceTag } from '../../components/PriceTag';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BookOffer } from '@bookscompare/contracts';
import type { HomeStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'SearchResult'>;

export function SearchResultScreen({ navigation, route }: Props) {
  const { data, error, isLoading, isRefetching, refetch } = useIsbnLookup(route.params.isbn);
  const offers = useMemo(
    () => [...(data?.data ?? [])].sort((left, right) => left.price - right.price),
    [data?.data]
  );

  const openOffer = (item: BookOffer) => {
    track('search_result_open_offer', {
      isbn: route.params.isbn,
      sourceId: item.sourceId,
    });
    navigation.navigate('SearchWebView', {
      title: `${item.sourceName} - ${item.title}`,
      url: item.url,
      showOptions: true,
    });
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
            <Text style={styles.ebookBadgeText}>電子書</Text>
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
        title="未能載入內容"
        description={'請檢查您的網絡連接。\n如持續遇到此問題，請聯絡我們以取得協助。'}
        actionLabel="重新載入"
        onAction={() => void refetch()}
        containerStyle={styles.container}
      />
    );
  }

  if (!isLoading && offers.length === 0) {
    return (
      <EmptyState
        icon="sad"
        title="未能找到結果"
        description={
          '抱歉，找不到所搜尋書本的價格資料。\n您慣用的網絡書店不在名單上？\n歡迎提交意見給我們！'
        }
        containerStyle={styles.container}
      />
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={offers}
        keyExtractor={(item) => `${item.sourceId}:${item.sourceProductId}`}
        ListHeaderComponent={
          offers.length > 0 ? (
            <View style={styles.divider}>
              <Text style={styles.dividerText}>共找到 {offers.length} 個結果。</Text>
            </View>
          ) : null
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        onRefresh={() => void refetch()}
        refreshing={isRefetching}
        renderItem={renderOffer}
      />
      {isLoading ? <LoadingOverlay label="正在比對最新書價…" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
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
