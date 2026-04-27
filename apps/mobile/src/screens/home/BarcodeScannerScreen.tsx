import { StyleSheet } from 'react-native';

import { EmptyState } from '../../components/EmptyState';
import { colors } from '../../theme/colors';

export function BarcodeScannerScreen() {
  return (
    <EmptyState
      icon="scan"
      title="掃描器正在搬家"
      description="新的 Expo 相機掃描流程會在下一個實作步驟接上，結構與權限設定已經準備好。"
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
