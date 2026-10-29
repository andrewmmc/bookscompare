import { useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { spacing } from '../theme/spacing';

import { getColumnLayout } from './adaptiveLayout';
import { useAdaptiveLayout } from './useAdaptiveLayout';

import type { ComponentType, ReactElement } from 'react';
import type { FlatListProps, ListRenderItemInfo } from 'react-native';

export interface AdaptiveListItemInfo<T> {
  item: T;
  index: number;
  /** Whether the item starts its visual group: the list in one column, the item itself in two. */
  isFirst: boolean;
  /** Whether the item ends its visual group: the list in one column, the item itself in two. */
  isLast: boolean;
}

interface AdaptiveListRow<T> {
  key: string;
  entries: Array<{ key: string; item: T; index: number }>;
}

type ForwardedFlatListProps<T> = Omit<
  FlatListProps<AdaptiveListRow<T>>,
  | 'data'
  | 'renderItem'
  | 'keyExtractor'
  | 'numColumns'
  | 'columnWrapperStyle'
  | 'ItemSeparatorComponent'
  | 'contentContainerStyle'
>;

export type AdaptiveListProps<T> = ForwardedFlatListProps<T> & {
  data: readonly T[];
  keyExtractor: (item: T, index: number) => string;
  renderItem: (info: AdaptiveListItemInfo<T>) => ReactElement | null;
  /** Horizontal margin around each column, inside the safe area. */
  margin: number;
  /** Separator between items in a single column; two columns are separated by spacing. */
  ItemSeparatorComponent?: ComponentType;
  /** Vertical padding for the content container; horizontal padding comes from the layout. */
  contentPaddingTop?: number;
  contentPaddingBottom?: number;
};

function RowGap() {
  return <View style={styles.rowGap} />;
}

/**
 * A `FlatList` that shows one column on compact windows and two columns on regular-width
 * windows, splitting at iPhone Duo's fold when it is active. Items are always grouped in rows so
 * switching between one and two columns keeps the same list mounted and its scroll position.
 */
export function AdaptiveList<T>({
  data,
  keyExtractor,
  renderItem,
  margin,
  ItemSeparatorComponent,
  contentPaddingTop,
  contentPaddingBottom,
  ...flatListProps
}: AdaptiveListProps<T>) {
  const layout = useAdaptiveLayout();
  const { numColumns, paddingLeft, paddingRight, columnGap, columnWidths } = getColumnLayout(
    layout,
    margin
  );

  const rows = useMemo(() => {
    const result: AdaptiveListRow<T>[] = [];
    data.forEach((item, index) => {
      const entry = { key: keyExtractor(item, index), item, index };
      const row = index % numColumns === 0 ? undefined : result[result.length - 1];
      if (row) {
        row.entries.push(entry);
      } else {
        result.push({ key: entry.key, entries: [entry] });
      }
    });
    return result;
  }, [data, keyExtractor, numColumns]);

  const isGrid = numColumns > 1;
  const lastIndex = data.length - 1;

  const renderRow = ({ item: row }: ListRenderItemInfo<AdaptiveListRow<T>>) => {
    if (!isGrid) {
      const [entry] = row.entries;
      return entry
        ? renderItem({
            item: entry.item,
            index: entry.index,
            isFirst: entry.index === 0,
            isLast: entry.index === lastIndex,
          })
        : null;
    }

    return (
      <View style={[styles.gridRow, { columnGap }]}>
        {row.entries.map((entry, column) => (
          <View key={entry.key} style={{ width: columnWidths[column] }}>
            {renderItem({ item: entry.item, index: entry.index, isFirst: true, isLast: true })}
          </View>
        ))}
      </View>
    );
  };

  return (
    <FlatList
      {...flatListProps}
      data={rows}
      keyExtractor={(row) => row.key}
      renderItem={renderRow}
      ItemSeparatorComponent={isGrid ? RowGap : ItemSeparatorComponent}
      contentContainerStyle={{
        paddingLeft,
        paddingRight,
        paddingTop: contentPaddingTop,
        paddingBottom: contentPaddingBottom,
      }}
    />
  );
}

const styles = StyleSheet.create({
  gridRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  rowGap: {
    height: spacing.sm,
  },
});
