import Ionicons from '@expo/vector-icons/Ionicons';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { useCallback, useLayoutEffect, useRef } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { track } from '../analytics';
import { spacing } from '../theme/spacing';
import { useTheme } from '../theme/ThemeProvider';

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
  sortAction: string;
  newestFirstAction: string;
  oldestFirstAction: string;
}

type SortDirection = 'desc' | 'asc';

interface UseClearAllHeaderActionOptions {
  navigation: NavigationLike;
  strings: ClearAllStrings;
  clickEvent: string;
  confirmEvent: string;
  onConfirm: () => void;
  sortDirection: SortDirection;
  onSortDirectionChange: (direction: SortDirection) => void;
}

interface HeaderSortActionProps {
  strings: ClearAllStrings;
  sortDirection: SortDirection;
  onSortDirectionChange: (direction: SortDirection) => void;
  colors: ThemeColors;
  scheme: 'light' | 'dark';
}

interface HeaderClearActionProps {
  strings: ClearAllStrings;
  onPress: () => void;
  colors: ThemeColors;
}

function HeaderSortAction({
  strings,
  sortDirection,
  onSortDirectionChange,
  colors,
  scheme,
}: HeaderSortActionProps) {
  const { showActionSheetWithOptions } = useActionSheet();

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
    <Pressable
      accessibilityLabel={strings.sortAction}
      accessibilityRole="button"
      hitSlop={8}
      onPress={handleSortPress}
      style={({ pressed }) => [styles.headerAction, pressed && styles.headerActionPressed]}
    >
      <Ionicons color={colors.ink} name="swap-vertical" size={20} />
    </Pressable>
  );
}

function HeaderClearAction({ strings, onPress, colors }: HeaderClearActionProps) {
  return (
    <Pressable
      accessibilityLabel={strings.clearAllAction}
      accessibilityRole="button"
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.headerAction, pressed && styles.headerActionPressed]}
    >
      <Ionicons color={colors.ink} name="trash-outline" size={20} />
    </Pressable>
  );
}

type HeaderActionsProps = HeaderSortActionProps & HeaderClearActionProps;

function HeaderActions(props: HeaderActionsProps) {
  return (
    <View style={styles.headerActions}>
      <HeaderSortAction {...props} />
      <HeaderClearAction {...props} />
    </View>
  );
}

/**
 * Installs a "Clear all" header action that confirms via an Alert before
 * running `onConfirm`, tracking the click and confirmation events.
 */
export function useClearAllHeaderAction({
  navigation,
  strings,
  clickEvent,
  confirmEvent,
  onConfirm,
  sortDirection,
  onSortDirectionChange,
}: UseClearAllHeaderActionOptions): void {
  const { colors, scheme } = useTheme();
  const onConfirmRef = useRef(onConfirm);
  const onSortDirectionChangeRef = useRef(onSortDirectionChange);

  useLayoutEffect(() => {
    onConfirmRef.current = onConfirm;
    onSortDirectionChangeRef.current = onSortDirectionChange;
  }, [onConfirm, onSortDirectionChange]);

  const handleClearPress = useCallback(() => {
    track(clickEvent);
    Alert.alert(strings.clearAllConfirmTitle, strings.clearAllConfirmMessage, [
      { text: strings.cancelAction, style: 'cancel' },
      {
        text: strings.clearAllConfirmAction,
        style: 'destructive',
        onPress: () => {
          track(confirmEvent);
          onConfirmRef.current();
        },
      },
    ]);
  }, [clickEvent, confirmEvent, strings]);
  const handleSortDirectionChange = useCallback((direction: SortDirection) => {
    onSortDirectionChangeRef.current(direction);
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <HeaderActions
          colors={colors}
          onPress={handleClearPress}
          onSortDirectionChange={handleSortDirectionChange}
          scheme={scheme}
          sortDirection={sortDirection}
          strings={strings}
        />
      ),
    });
  }, [
    navigation,
    strings,
    handleClearPress,
    handleSortDirectionChange,
    sortDirection,
    colors,
    scheme,
  ]);
}

const styles = StyleSheet.create({
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerAction: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActionPressed: {
    opacity: 0.6,
  },
});
