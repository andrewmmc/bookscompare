import { useLayoutEffect, useMemo } from 'react';
import { Alert, Pressable, StyleSheet, Text } from 'react-native';

import { track } from '../analytics';
import { spacing } from '../theme/spacing';
import { useTheme } from '../theme/ThemeProvider';
import { typography } from '../theme/typography';

import type { ReactNode } from 'react';
import type { ThemeColors } from '../theme/colors';

interface NavigationLike {
  setOptions: (options: { headerRight?: () => ReactNode }) => void;
}

export interface ClearAllStrings {
  clearAllAction: string;
  clearAllConfirmTitle: string;
  clearAllConfirmMessage: string;
  clearAllConfirmAction: string;
  cancelAction: string;
}

interface UseClearAllHeaderActionOptions {
  navigation: NavigationLike;
  visible: boolean;
  strings: ClearAllStrings;
  clickEvent: string;
  confirmEvent: string;
  onConfirm: () => void;
}

/**
 * Installs a "Clear all" header action that confirms via an Alert before
 * running `onConfirm`, tracking the click and confirmation events.
 */
export function useClearAllHeaderAction({
  navigation,
  visible,
  strings,
  clickEvent,
  confirmEvent,
  onConfirm,
}: UseClearAllHeaderActionOptions): void {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  useLayoutEffect(() => {
    const handlePress = () => {
      track(clickEvent);
      Alert.alert(strings.clearAllConfirmTitle, strings.clearAllConfirmMessage, [
        { text: strings.cancelAction, style: 'cancel' },
        {
          text: strings.clearAllConfirmAction,
          style: 'destructive',
          onPress: () => {
            track(confirmEvent);
            onConfirm();
          },
        },
      ]);
    };

    navigation.setOptions({
      headerRight: () =>
        visible ? (
          <Pressable
            accessibilityLabel={strings.clearAllAction}
            accessibilityRole="button"
            hitSlop={8}
            onPress={handlePress}
            style={({ pressed }) => [styles.headerAction, pressed && styles.headerActionPressed]}
          >
            <Text style={styles.headerActionText}>{strings.clearAllAction}</Text>
          </Pressable>
        ) : null,
    });
  }, [navigation, visible, strings, clickEvent, confirmEvent, onConfirm, styles]);
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    headerAction: {
      paddingHorizontal: spacing.xs,
      paddingVertical: spacing.xxs,
    },
    headerActionPressed: {
      opacity: 0.6,
    },
    headerActionText: {
      ...typography.body,
      color: colors.navigationAction,
      fontWeight: '500',
    },
  });
}
