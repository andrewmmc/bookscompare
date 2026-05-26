import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

import { spacing } from '../theme/spacing';
import { useTheme } from '../theme/ThemeProvider';
import { typography } from '../theme/typography';

import type { ThemeColors } from '../theme/colors';

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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.container, containerStyle]}>
      <Ionicons color={colors.ink} name={icon} size={72} style={styles.icon} />
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

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xxl,
      gap: spacing.sm,
      backgroundColor: colors.canvas,
    },
    icon: {
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    title: {
      ...typography.hero,
      color: colors.ink,
      textAlign: 'center',
    },
    description: {
      ...typography.body,
      color: colors.ink,
      textAlign: 'center',
      maxWidth: 340,
    },
    actionButton: {
      marginTop: spacing.md,
    },
  });
