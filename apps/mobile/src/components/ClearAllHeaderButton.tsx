import Ionicons from '@expo/vector-icons/Ionicons';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { track } from '../analytics';
import { spacing } from '../theme/spacing';
import { useTheme } from '../theme/ThemeProvider';
import { typography } from '../theme/typography';

import type { NativeStackHeaderItem } from '@react-navigation/native-stack';
import type { ReactNode } from 'react';
import type { ThemeColors } from '../theme/colors';

interface NavigationLike {
  setOptions: (options: {
    headerRight?: () => ReactNode;
    unstable_headerRightItems?: () => NativeStackHeaderItem[];
  }) => void;
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
  visible: boolean;
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
    <Pressable
      accessibilityLabel={strings.sortAction}
      accessibilityRole="button"
      hitSlop={8}
      onPress={handleSortPress}
      style={({ pressed }) => [styles.sortAction, pressed && styles.headerActionPressed]}
    >
      <Ionicons color={colors.ink} name="swap-vertical" size={20} />
    </Pressable>
  );
}

function HeaderClearAction({ strings, onPress, colors }: HeaderClearActionProps) {
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Pressable
      accessibilityLabel={strings.clearAllAction}
      accessibilityRole="button"
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.headerAction, pressed && styles.headerActionPressed]}
    >
      <Text style={styles.headerActionText}>{strings.clearAllAction}</Text>
    </Pressable>
  );
}

interface HeaderActionsProps extends HeaderSortActionProps, HeaderClearActionProps {
  visible: boolean;
}

function HeaderActions(props: HeaderActionsProps) {
  const styles = useMemo(() => createStyles(props.colors), [props.colors]);

  return (
    <View style={styles.headerActions}>
      <HeaderSortAction {...props} />
      {props.visible ? <HeaderClearAction {...props} /> : null}
    </View>
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
      unstable_headerRightItems: () => [
        {
          type: 'menu',
          label: strings.sortAction,
          accessibilityLabel: strings.sortAction,
          icon: { type: 'sfSymbol', name: 'arrow.up.arrow.down' },
          menu: {
            title: strings.sortAction,
            items: [
              {
                type: 'action',
                label: strings.newestFirstAction,
                state: sortDirection === 'desc' ? 'on' : 'off',
                onPress: () => handleSortDirectionChange('desc'),
              },
              {
                type: 'action',
                label: strings.oldestFirstAction,
                state: sortDirection === 'asc' ? 'on' : 'off',
                onPress: () => handleSortDirectionChange('asc'),
              },
            ],
          },
        },
        ...(visible
          ? [
              {
                type: 'button' as const,
                label: strings.clearAllAction,
                accessibilityLabel: strings.clearAllAction,
                onPress: handleClearPress,
              },
            ]
          : []),
      ],
      headerRight: () => (
        <HeaderActions
          colors={colors}
          onPress={handleClearPress}
          onSortDirectionChange={handleSortDirectionChange}
          scheme={scheme}
          sortDirection={sortDirection}
          strings={strings}
          visible={visible}
        />
      ),
    });
  }, [
    navigation,
    visible,
    strings,
    handleClearPress,
    handleSortDirectionChange,
    sortDirection,
    colors,
    scheme,
  ]);
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
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
