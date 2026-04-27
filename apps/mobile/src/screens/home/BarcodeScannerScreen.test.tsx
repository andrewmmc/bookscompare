import { fireEvent } from '@testing-library/react-native';

import { BarcodeScannerScreen } from './BarcodeScannerScreen';
import { renderWithProviders } from '../../test/test-utils';

const mockUseCameraPermissions = jest.fn();

jest.mock('expo-camera', () => ({
  CameraView: ({ onBarcodeScanned }: { onBarcodeScanned?: (result: { data: string }) => void }) => {
    const { Pressable } = jest.requireActual('react-native');

    return (
      <Pressable
        testID="camera-view"
        onPress={() => onBarcodeScanned?.({ data: '9781402894626' })}
      />
    );
  },
  useCameraPermissions: (...args: unknown[]) => mockUseCameraPermissions(...args),
}));

describe('BarcodeScannerScreen', () => {
  it('navigates to results after a valid isbn scan', () => {
    mockUseCameraPermissions.mockReturnValue([{ granted: true }, jest.fn()]);

    const navigation = {
      replace: jest.fn(),
    };

    const screen = renderWithProviders(
      <BarcodeScannerScreen
        navigation={navigation as never}
        route={{ key: 'BarcodeScanner', name: 'BarcodeScanner' } as never}
      />
    );

    fireEvent.press(screen.getByTestId('camera-view'));

    expect(navigation.replace).toHaveBeenCalledWith('SearchResult', {
      isbn: '9781402894626',
    });
  });
});
