import { StyleSheet } from 'react-native';

import { EmptyState } from '../../components/EmptyState';
import { colors } from '../../theme/colors';

export function WebViewScreen() {
  return (
    <EmptyState
      icon="globe"
      title="頁面檢視器已就位"
      description="新的 WebView 與外部瀏覽器操作會在下一個實作步驟接上。"
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
