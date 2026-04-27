import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';

import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

interface LoadingOverlayProps {
  label?: string;
}

export function LoadingOverlay({ label = '載入中…' }: LoadingOverlayProps) {
  return (
    <View style={styles.overlay} pointerEvents="none">
      <View style={styles.card}>
        <ActivityIndicator color="#ffffff" size="large" />
        {label ? <Text style={styles.label}>{label}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    minWidth: 100,
    minHeight: 100,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  label: {
    ...typography.caption,
    color: '#ffffff',
  },
});
