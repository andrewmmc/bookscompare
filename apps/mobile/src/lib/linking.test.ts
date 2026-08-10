import { Alert, Linking } from 'react-native';

import { getSecureWebOrigin, openExternalUrl } from './linking';

describe('getSecureWebOrigin', () => {
  it('accepts only valid HTTPS URLs', () => {
    expect(getSecureWebOrigin('https://example.com/book')).toBe('https://example.com');
    expect(getSecureWebOrigin('http://example.com/book')).toBeNull();
    expect(getSecureWebOrigin('javascript:alert(1)')).toBeNull();
    expect(getSecureWebOrigin('not a url')).toBeNull();
  });
});

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

    await expect(openExternalUrl('https://example.com/book')).resolves.toBe(false);

    expect(canOpenURL).toHaveBeenCalledWith('https://example.com/book');
    expect(openURL).not.toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith(
      '無法開啟連結',
      '目前無法在裝置上開啟這個連結。請稍後再試。',
      [{ text: '知道了' }]
    );
  });

  it('rejects non-HTTPS URLs without handing them to the operating system', async () => {
    const canOpenURL = jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);

    await expect(openExternalUrl('javascript:alert(1)')).resolves.toBe(false);

    expect(canOpenURL).not.toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalled();
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
