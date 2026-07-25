import Ionicons from '@expo/vector-icons/Ionicons';
import { useLayoutEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Menu } from 'react-native-paper';

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

interface HeaderActionsProps extends Omit<UseClearAllHeaderActionOptions, 'navigation'> {
  colors: ThemeColors;
}

function HeaderActions({
  visible,
  strings,
  clickEvent,
  confirmEvent,
  onConfirm,
  sortDirection,
  onSortDirectionChange,
  colors,
}: HeaderActionsProps) {
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (!visible) {
    return null;
  }

  const handleClearPress = () => {
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

  const selectSortDirection = (direction: SortDirection) => {
    setSortMenuVisible(false);
    onSortDirectionChange(direction);
  };

  return (
    <View style={styles.headerActions}>
      <Menu
        anchor={
          <Pressable
            accessibilityLabel={strings.sortAction}
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => setSortMenuVisible(true)}
            style={({ pressed }) => [styles.sortAction, pressed && styles.headerActionPressed]}
          >
            <Ionicons color={colors.ink} name="swap-vertical" size={20} />
          </Pressable>
        }
        anchorPosition="bottom"
        onDismiss={() => setSortMenuVisible(false)}
        visible={sortMenuVisible}
      >
        <Menu.Item
          {...(sortDirection === 'desc' ? { leadingIcon: 'check' } : {})}
          onPress={() => selectSortDirection('desc')}
          title={strings.newestFirstAction}
        />
        <Menu.Item
          {...(sortDirection === 'asc' ? { leadingIcon: 'check' } : {})}
          onPress={() => selectSortDirection('asc')}
          title={strings.oldestFirstAction}
        />
      </Menu>
      <Pressable
        accessibilityLabel={strings.clearAllAction}
        accessibilityRole="button"
        hitSlop={8}
        onPress={handleClearPress}
        style={({ pressed }) => [styles.headerAction, pressed && styles.headerActionPressed]}
      >
        <Text style={styles.headerActionText}>{strings.clearAllAction}</Text>
      </Pressable>
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
  const { colors } = useTheme();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        visible ? (
          <HeaderActions
            clickEvent={clickEvent}
            colors={colors}
            confirmEvent={confirmEvent}
            onConfirm={onConfirm}
            onSortDirectionChange={onSortDirectionChange}
            sortDirection={sortDirection}
            strings={strings}
            visible={visible}
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
    colors,
  ]);
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
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
