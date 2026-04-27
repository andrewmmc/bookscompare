import { StyleSheet } from 'react-native';

import { EmptyState } from '../../components/EmptyState';
import { colors } from '../../theme/colors';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'SearchResult'>;

export function SearchResultScreen({ route }: Props) {
  return (
    <EmptyState
      icon="library"
      title={`正在準備 ${route.params.isbn}`}
      description="新的 API 查詢與結果列表會在下一個實作步驟接上。導航、型別與版面骨架已經就位。"
      containerStyle={styles.container}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
});
