import { act, renderHook } from '@testing-library/react-native';
import { Accelerometer } from 'expo-sensors';

import { useShakeToUndo } from './useShakeToUndo';

const mockRemove = jest.fn();
let sensorListener: ((sample: { x: number; y: number; z: number }) => void) | undefined;

jest.mock('expo-sensors', () => ({
  Accelerometer: {
    addListener: jest.fn((listener) => {
      sensorListener = listener;
      return { remove: mockRemove };
    }),
    setUpdateInterval: jest.fn(),
  },
}));

describe('useShakeToUndo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sensorListener = undefined;
  });

  it('runs undo after two strong movements and removes the listener on unmount', async () => {
    const onUndo = jest.fn();
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValueOnce(10_000).mockReturnValueOnce(10_100);
    const { unmount } = await renderHook(() => useShakeToUndo(onUndo, true));

    await act(() => {
      sensorListener?.({ x: 0, y: 0, z: 1 });
      sensorListener?.({ x: 2, y: 0, z: 0 });
      sensorListener?.({ x: -2, y: 0, z: 0 });
    });

    expect(Accelerometer.setUpdateInterval).toHaveBeenCalledWith(100);
    expect(onUndo).toHaveBeenCalledTimes(1);
    await unmount();
    expect(mockRemove).toHaveBeenCalledTimes(1);
    nowSpy.mockRestore();
  });

  it('does not subscribe when there is nothing to undo', async () => {
    await renderHook(() => useShakeToUndo(jest.fn(), false));
    expect(Accelerometer.addListener).not.toHaveBeenCalled();
  });
});
