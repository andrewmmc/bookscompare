import { Accelerometer } from 'expo-sensors';
import { useEffect, useRef } from 'react';

import type { Subscription } from 'expo-sensors/build/DeviceSensor';

const SHAKE_DELTA = 1.7;
const SHAKE_WINDOW_MS = 600;
const SHAKE_COOLDOWN_MS = 1_500;
let activeSubscription: Subscription | undefined;
let activeOwner: symbol | undefined;

export function useShakeToUndo(onUndo: () => void, enabled: boolean) {
  const onUndoRef = useRef(onUndo);

  useEffect(() => {
    onUndoRef.current = onUndo;
  }, [onUndo]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let previous: { x: number; y: number; z: number } | undefined;
    let strikeCount = 0;
    let lastStrikeAt = 0;
    let lastUndoAt = 0;

    activeSubscription?.remove();
    const owner = Symbol('shake-to-undo');
    activeOwner = owner;

    Accelerometer.setUpdateInterval(100);
    const subscription = Accelerometer.addListener((sample) => {
      if (!previous) {
        previous = sample;
        return;
      }

      const delta =
        Math.abs(sample.x - previous.x) +
        Math.abs(sample.y - previous.y) +
        Math.abs(sample.z - previous.z);
      const now = Date.now();
      previous = sample;

      if (delta < SHAKE_DELTA) {
        return;
      }

      strikeCount = now - lastStrikeAt <= SHAKE_WINDOW_MS ? strikeCount + 1 : 1;
      lastStrikeAt = now;
      if (strikeCount < 2 || now - lastUndoAt < SHAKE_COOLDOWN_MS) {
        return;
      }

      strikeCount = 0;
      lastUndoAt = now;
      onUndoRef.current();
    });
    activeSubscription = subscription;

    return () => {
      if (activeOwner === owner) {
        subscription.remove();
        activeSubscription = undefined;
        activeOwner = undefined;
      }
    };
  }, [enabled]);
}
