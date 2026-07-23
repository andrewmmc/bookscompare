import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useMemo, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { spacing } from '../theme/spacing';
import { useTheme } from '../theme/ThemeProvider';
import { typography } from '../theme/typography';

import type { ReactNode } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import type { ThemeColors } from '../theme/colors';

const ACTION_WIDTH = 96;
const REVEAL_THRESHOLD = 40;
const FULL_SWIPE_RATIO = 0.7;

interface SwipeToDeleteRowProps {
  children: ReactNode;
  deleteAccessibilityLabel: string;
  deleteLabel: string;
  isFirst: boolean;
  isLast: boolean;
  isOpen: boolean;
  itemId: string;
  onClose: (itemId: string) => void;
  onDelete: () => void;
  onOpen: (itemId: string) => void;
}

export function SwipeToDeleteRow({
  children,
  deleteAccessibilityLabel,
  deleteLabel,
  isFirst,
  isLast,
  isOpen,
  itemId,
  onClose,
  onDelete,
  onOpen,
}: SwipeToDeleteRowProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [translateX] = useState(() => new Animated.Value(0));
  const [currentOffset, setCurrentOffset] = useState(0);
  const [gestureContext, setGestureContext] = useState({
    deleteCommitted: false,
    rowWidth: 0,
    startOffset: 0,
  });

  const animateTo = useCallback(
    (value: number) => {
      setCurrentOffset(value);
      Animated.spring(translateX, {
        bounciness: 0,
        restDisplacementThreshold: 0.4,
        restSpeedThreshold: 1.7,
        toValue: value,
        useNativeDriver: true,
      }).start();
    },
    [translateX]
  );

  const syncClosedState = useCallback(() => {
    if (!isOpen && currentOffset !== 0 && !gestureContext.deleteCommitted) {
      animateTo(0);
    }
  }, [animateTo, currentOffset, gestureContext.deleteCommitted, isOpen]);

  const commitDelete = useCallback(() => {
    setGestureContext((previous) => {
      if (previous.deleteCommitted) {
        return previous;
      }

      onDelete();
      return { ...previous, deleteCommitted: true };
    });
  }, [onDelete]);

  const handleGestureStart = useCallback(() => {
    setGestureContext((previous) => ({ ...previous, startOffset: currentOffset }));
  }, [currentOffset]);

  const handleGestureUpdate = useCallback(
    ({ translationX }: { translationX: number }) => {
      const next = Math.max(
        -gestureContext.rowWidth,
        Math.min(0, gestureContext.startOffset + translationX)
      );
      setCurrentOffset(next);
      translateX.setValue(next);
    },
    [gestureContext.rowWidth, gestureContext.startOffset, translateX]
  );

  const handleGestureEnd = useCallback(() => {
    if (
      gestureContext.rowWidth > 0 &&
      currentOffset <= -gestureContext.rowWidth * FULL_SWIPE_RATIO
    ) {
      animateTo(-gestureContext.rowWidth);
      commitDelete();
    } else if (currentOffset <= -REVEAL_THRESHOLD) {
      animateTo(-ACTION_WIDTH);
      onOpen(itemId);
    } else {
      animateTo(0);
      onClose(itemId);
    }
  }, [animateTo, commitDelete, currentOffset, gestureContext.rowWidth, itemId, onClose, onOpen]);

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-10, 10])
        .failOffsetY([-10, 10])
        .runOnJS(true)
        .onStart(handleGestureStart)
        .onUpdate(handleGestureUpdate)
        .onEnd(handleGestureEnd),
    [handleGestureEnd, handleGestureStart, handleGestureUpdate]
  );

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const nextRowWidth = event.nativeEvent.layout.width;
    setGestureContext((previous) => {
      if (previous.rowWidth === nextRowWidth) {
        return previous;
      }

      return { ...previous, rowWidth: nextRowWidth };
    });
  }, []);

  syncClosedState();

  return (
    <View
      onLayout={handleLayout}
      style={[styles.shell, isFirst && styles.rowFirst, isLast && styles.rowLast]}
    >
      <View style={styles.deleteAction}>
        <Pressable
          accessibilityLabel={deleteAccessibilityLabel}
          accessibilityRole="button"
          android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
          onPress={commitDelete}
          style={({ pressed }) => [styles.deleteButton, pressed && styles.deleteButtonPressed]}
        >
          <Ionicons color="#ffffff" name="trash" size={20} />
          <Text style={styles.deleteText}>{deleteLabel}</Text>
        </Pressable>
      </View>
      <GestureDetector gesture={gesture}>
        <Animated.View style={{ transform: [{ translateX }] }}>{children}</Animated.View>
      </GestureDetector>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    shell: {
      backgroundColor: colors.danger,
      overflow: 'hidden',
    },
    rowFirst: {
      borderTopLeftRadius: 14,
      borderTopRightRadius: 14,
    },
    rowLast: {
      borderBottomLeftRadius: 14,
      borderBottomRightRadius: 14,
    },
    deleteAction: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      top: 0,
      width: ACTION_WIDTH,
      backgroundColor: colors.danger,
    },
    deleteButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xxs,
    },
    deleteButtonPressed: {
      opacity: 0.85,
    },
    deleteText: {
      ...typography.footnote,
      color: '#ffffff',
      fontWeight: '600',
    },
  });
