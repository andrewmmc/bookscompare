import { Dimensions } from 'react-native';

export const PHONE_WINDOW = { width: 393, height: 852 };
/** A regular-width window, such as iPhone Duo's inner display while open. */
export const WIDE_WINDOW = { width: 900, height: 760 };

export function setTestWindowSize({ width, height }: { width: number; height: number }) {
  const metrics = { width, height, scale: 3, fontScale: 1 };
  Dimensions.set({ window: metrics, screen: metrics });
}

export function resetTestWindowSize() {
  setTestWindowSize(PHONE_WINDOW);
}
