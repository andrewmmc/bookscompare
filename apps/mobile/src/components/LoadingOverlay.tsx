import { BlurView } from 'expo-blur';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { strings } from '../i18n/strings';
import { spacing } from '../theme/spacing';
import { useTheme } from '../theme/ThemeProvider';
import { typography } from '../theme/typography';

interface LoadingOverlayProps {
  label?: string;
}

export function LoadingOverlay({ label = strings.loading.defaultLabel }: LoadingOverlayProps) {
  const { colors, scheme } = useTheme();
  const blurTint = scheme === 'dark' ? 'dark' : 'light';

  return (
    <View style={styles.overlay} pointerEvents="none">
      <BlurView intensity={60} tint={blurTint} style={styles.card}>
        <ActivityIndicator color={colors.ink} size="large" />
        {label ? <Text style={[styles.label, { color: colors.ink }]}>{label}</Text> : null}
      </BlurView>
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
    minWidth: 120,
    minHeight: 120,
    borderRadius: 18,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    overflow: 'hidden',
  },
  label: {
    ...typography.footnote,
    marginTop: spacing.xxs,
    textAlign: 'center',
  },
});
