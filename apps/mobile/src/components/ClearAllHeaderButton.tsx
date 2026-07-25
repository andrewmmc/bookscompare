import Ionicons from '@expo/vector-icons/Ionicons';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { useLayoutEffect, useMemo } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { track } from '../analytics';
import { spacing } from '../theme/spacing';
import { useTheme } from '../theme/ThemeProvider';
import { typography } from '../theme/typography';

import type { ReactNode } from 'react';
import type { ThemeColors } from '../theme/colors';

interface NavigationLike {
  setOptions: (options: { headerLeft?: () => ReactNode; headerRight?: () => ReactNode }) => void;
}

export interface ClearAllStrings {
  clearAllAction: string;
  clearAllConfirmTitle: string;
  clearAllConfirmMessage: string;
  clearAllConfirmAction: string;
  cancelAction: string;
  sortAction: string;
  newestFirstAction: string;
  oldestFirstAction: string;
  backAction: string;
}

type SortDirection = 'desc' | 'asc';

interface UseClearAllHeaderActionOptions {
  navigation: NavigationLike;
  visible: boolean;
  strings: ClearAllStrings;
  clickEvent: string;
  confirmEvent: string;
  onConfirm: () => void;
  sortDirection: SortDirection;
  onSortDirectionChange: (direction: SortDirection) => void;
  showBackButton?: boolean;
  onBack?: () => void;
}

interface HeaderSortActionProps {
  strings: ClearAllStrings;
  sortDirection: SortDirection;
  onSortDirectionChange: (direction: SortDirection) => void;
  showBackButton?: boolean;
  onBack?: () => void;
  colors: ThemeColors;
  scheme: 'light' | 'dark';
}

interface HeaderClearActionProps {
  strings: ClearAllStrings;
  clickEvent: string;
  confirmEvent: string;
  onConfirm: () => void;
  colors: ThemeColors;
}

function HeaderSortAction({
  strings,
  sortDirection,
  onSortDirectionChange,
  showBackButton,
  onBack,
  colors,
  scheme,
}: HeaderSortActionProps) {
  const { showActionSheetWithOptions } = useActionSheet();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleSortPress = () => {
    const selectedPrefix = '✓ ';
    showActionSheetWithOptions(
      {
        title: strings.sortAction,
        options: [
          `${sortDirection === 'desc' ? selectedPrefix : ''}${strings.newestFirstAction}`,
          `${sortDirection === 'asc' ? selectedPrefix : ''}${strings.oldestFirstAction}`,
          strings.cancelAction,
        ],
        cancelButtonIndex: 2,
        tintColor: colors.navigationAction,
        userInterfaceStyle: scheme,
      },
      (selectedIndex) => {
        if (selectedIndex === 0) {
          onSortDirectionChange('desc');
        } else if (selectedIndex === 1) {
          onSortDirectionChange('asc');
        }
      }
    );
  };

  return (
    <View style={styles.headerLeftActions}>
      {showBackButton ? (
        <Pressable
          accessibilityLabel={strings.backAction}
          accessibilityRole="button"
          hitSlop={8}
          onPress={onBack}
          style={({ pressed }) => [styles.backAction, pressed && styles.headerActionPressed]}
        >
          <Ionicons color={colors.navigationAction} name="chevron-back" size={26} />
        </Pressable>
      ) : null}
      <Pressable
        accessibilityLabel={strings.sortAction}
        accessibilityRole="button"
        hitSlop={8}
        onPress={handleSortPress}
        style={({ pressed }) => [styles.sortAction, pressed && styles.headerActionPressed]}
      >
        <Ionicons color={colors.navigationAction} name="swap-vertical" size={20} />
      </Pressable>
    </View>
  );
}

function HeaderClearAction({
  strings,
  clickEvent,
  confirmEvent,
  onConfirm,
  colors,
}: HeaderClearActionProps) {
  const styles = useMemo(() => createStyles(colors), [colors]);

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

  return (
    <Pressable
      accessibilityLabel={strings.clearAllAction}
      accessibilityRole="button"
      hitSlop={8}
      onPress={handlePress}
      style={({ pressed }) => [styles.headerAction, pressed && styles.headerActionPressed]}
    >
      <Text style={styles.headerActionText}>{strings.clearAllAction}</Text>
    </Pressable>
  );
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
  sortDirection,
  onSortDirectionChange,
  showBackButton,
  onBack,
}: UseClearAllHeaderActionOptions): void {
  const { colors, scheme } = useTheme();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <HeaderSortAction
          colors={colors}
          {...(onBack ? { onBack } : {})}
          onSortDirectionChange={onSortDirectionChange}
          scheme={scheme}
          showBackButton={showBackButton ?? false}
          sortDirection={sortDirection}
          strings={strings}
        />
      ),
      headerRight: () =>
        visible ? (
          <HeaderClearAction
            clickEvent={clickEvent}
            colors={colors}
            confirmEvent={confirmEvent}
            onConfirm={onConfirm}
            strings={strings}
          />
        ) : null,
    });
  }, [
    navigation,
    visible,
    strings,
    clickEvent,
    confirmEvent,
    onConfirm,
    sortDirection,
    onSortDirectionChange,
    showBackButton,
    onBack,
    colors,
    scheme,
  ]);
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    headerLeftActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    backAction: {
      marginLeft: -spacing.sm,
      paddingVertical: spacing.xxs,
    },
    sortAction: {
      padding: spacing.xxs,
    },
    headerAction: {
      paddingHorizontal: spacing.xs,
      paddingVertical: spacing.xxs,
    },
    headerActionPressed: {
      opacity: 0.6,
    },
    headerActionText: {
      ...typography.body,
      color: colors.ink,
      fontWeight: '500',
    },
  });
}
