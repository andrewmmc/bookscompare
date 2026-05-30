import { fireEvent } from '@testing-library/react-native';

import { BarcodeScannerScreen } from './BarcodeScannerScreen';
import { strings } from '../../i18n/strings';
import { renderWithProviders } from '../../test/test-utils';

const mockUseCameraPermissions = jest.fn();
const mockTrack = jest.fn();

jest.mock('../../analytics', () => ({
  track: (...args: unknown[]) => mockTrack(...args),
}));

jest.mock('expo-camera', () => ({
  CameraView: ({ onBarcodeScanned }: { onBarcodeScanned?: (result: { data: string }) => void }) => {
    const { Pressable } = jest.requireActual('react-native');

    return (
      <Pressable
        testID="camera-view"
        onPress={(event?: { nativeEvent?: { data?: string } }) =>
          onBarcodeScanned?.({ data: event?.nativeEvent?.data ?? '9781402894626' })
        }
      />
    );
  },
  useCameraPermissions: (...args: unknown[]) => mockUseCameraPermissions(...args),
}));

function renderScanner(navigation: { replace?: jest.Mock }) {
  return renderWithProviders(
    <BarcodeScannerScreen
      navigation={navigation as never}
      route={{ key: 'BarcodeScanner', name: 'BarcodeScanner' } as never}
    />
  );
}

describe('BarcodeScannerScreen', () => {
  beforeEach(() => {
    mockTrack.mockClear();
    mockUseCameraPermissions.mockReset();
  });

  it('navigates to results after a valid isbn scan', () => {
    mockUseCameraPermissions.mockReturnValue([{ granted: true }, jest.fn()]);

    const navigation = { replace: jest.fn() };
    const screen = renderScanner(navigation);

    fireEvent.press(screen.getByTestId('camera-view'));

    expect(navigation.replace).toHaveBeenCalledWith('SearchResult', {
      isbn: '9781402894626',
    });
    expect(mockTrack).toHaveBeenCalledWith('barcode_scanner_valid_barcode', { isbnLength: 13 });
  });

  it('shows a loading state while the permission is still resolving', () => {
    mockUseCameraPermissions.mockReturnValue([null, jest.fn()]);

    const screen = renderScanner({});

    expect(screen.getByText(strings.scanner.permissionCheckingLabel)).toBeTruthy();
    expect(screen.queryByTestId('camera-view')).toBeNull();
  });

  it('prompts to grant permission and requests it when the action is pressed', () => {
    const requestPermission = jest.fn();
    mockUseCameraPermissions.mockReturnValue([{ granted: false }, requestPermission]);

    const screen = renderScanner({});

    expect(screen.getByText(strings.scanner.permissionRequiredTitle)).toBeTruthy();
    fireEvent.press(screen.getByText(strings.scanner.permissionRequiredAction));

    expect(requestPermission).toHaveBeenCalledTimes(1);
  });

  it('ignores an invalid barcode without navigating', () => {
    mockUseCameraPermissions.mockReturnValue([{ granted: true }, jest.fn()]);

    const navigation = { replace: jest.fn() };
    const screen = renderScanner(navigation);

    fireEvent.press(screen.getByTestId('camera-view'), { nativeEvent: { data: 'not-an-isbn' } });

    expect(navigation.replace).not.toHaveBeenCalled();
    expect(mockTrack).toHaveBeenCalledWith('barcode_scanner_invalid_barcode');
  });
});
