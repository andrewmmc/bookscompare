import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  containerStyle?: object;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  containerStyle,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.iconWrap}>
        <Ionicons color={colors.accent} name={icon} size={34} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionLabel && onAction ? (
        <Button mode="contained" onPress={onAction} style={styles.actionButton}>
          {actionLabel}
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  iconWrap: {
    width: 74,
    height: 74,
    borderRadius: 37,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.highlight,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.sectionTitle,
    color: colors.ink,
    textAlign: 'center',
  },
  description: {
    ...typography.body,
    color: colors.inkMuted,
    textAlign: 'center',
    maxWidth: 340,
  },
  actionButton: {
    marginTop: spacing.sm,
  },
});
