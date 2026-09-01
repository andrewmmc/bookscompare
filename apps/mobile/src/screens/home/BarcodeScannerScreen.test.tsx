import { fireEvent } from '@testing-library/react-native';
import { Linking } from 'react-native';

import { BarcodeScannerScreen } from './BarcodeScannerScreen';
import { i18n } from '../../i18n';
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

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('navigates to results after a valid isbn scan', async () => {
    mockUseCameraPermissions.mockReturnValue([{ granted: true }, jest.fn()]);

    const navigation = { replace: jest.fn() };
    const screen = await renderScanner(navigation);

    await fireEvent.press(screen.getByTestId('camera-view'));

    expect(navigation.replace).toHaveBeenCalledWith('SearchResult', {
      isbn: '9781402894626',
    });
    expect(mockTrack).toHaveBeenCalledWith('barcode_scanner_valid_barcode', { isbnLength: 13 });
  });

  it('shows a loading state while the permission is still resolving', async () => {
    mockUseCameraPermissions.mockReturnValue([null, jest.fn()]);

    const screen = await renderScanner({});

    expect(
      screen.getByText(i18n.t('scanner.permissionCheckingLabel', { ns: 'home' }))
    ).toBeTruthy();
    expect(screen.queryByTestId('camera-view')).toBeNull();
  });

  it('prompts to grant permission and requests it when the action is pressed', async () => {
    const requestPermission = jest.fn();
    mockUseCameraPermissions.mockReturnValue([
      { granted: false, canAskAgain: true },
      requestPermission,
    ]);

    const screen = await renderScanner({});

    expect(
      screen.getByText(i18n.t('scanner.permissionRequiredTitle', { ns: 'home' }))
    ).toBeTruthy();
    await fireEvent.press(
      screen.getByText(i18n.t('scanner.permissionRequiredAction', { ns: 'home' }))
    );

    expect(requestPermission).toHaveBeenCalledTimes(1);
  });

  it('opens settings when camera permission cannot be requested again', async () => {
    const requestPermission = jest.fn();
    const openSettings = jest.spyOn(Linking, 'openSettings').mockResolvedValue();
    mockUseCameraPermissions.mockReturnValue([
      { granted: false, canAskAgain: false },
      requestPermission,
    ]);

    const screen = await renderScanner({});

    await fireEvent.press(
      screen.getByText(i18n.t('scanner.permissionSettingsAction', { ns: 'home' }))
    );

    expect(openSettings).toHaveBeenCalledTimes(1);
    expect(requestPermission).not.toHaveBeenCalled();
  });

  it('ignores an invalid barcode without navigating', async () => {
    mockUseCameraPermissions.mockReturnValue([{ granted: true }, jest.fn()]);

    const navigation = { replace: jest.fn() };
    const screen = await renderScanner(navigation);

    await fireEvent.press(screen.getByTestId('camera-view'), {
      nativeEvent: { data: 'not-an-isbn' },
    });

    expect(navigation.replace).not.toHaveBeenCalled();
    expect(mockTrack).toHaveBeenCalledWith('barcode_scanner_invalid_barcode');
  });
});
