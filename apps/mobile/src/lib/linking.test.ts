import { Alert, Linking } from 'react-native';

import { openExternalUrl } from './linking';

describe('openExternalUrl', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('delegates URL opening to React Native Linking', async () => {
    jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);

    await expect(openExternalUrl('https://example.com/book')).resolves.toBe(true);

    expect(openURL).toHaveBeenCalledWith('https://example.com/book');
  });

  it('returns false when React Native cannot open the URL', async () => {
    const canOpenURL = jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(false);
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);

    await expect(openExternalUrl('unsupported://book')).resolves.toBe(false);

    expect(canOpenURL).toHaveBeenCalledWith('unsupported://book');
    expect(openURL).not.toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith(
      '無法開啟連結',
      '目前無法在裝置上開啟這個連結。請稍後再試。',
      [{ text: '知道了' }]
    );
  });

  it('returns false when opening the URL fails', async () => {
    jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
    jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('unavailable'));

    await expect(openExternalUrl('https://example.com/book')).resolves.toBe(false);

    expect(Alert.alert).toHaveBeenCalledWith(
      '無法開啟連結',
      '目前無法在裝置上開啟這個連結。請稍後再試。',
      [{ text: '知道了' }]
    );
  });
});
