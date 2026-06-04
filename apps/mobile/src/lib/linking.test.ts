import { Linking } from 'react-native';

import { openExternalUrl } from './linking';

describe('openExternalUrl', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
  });

  it('returns false when opening the URL fails', async () => {
    jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
    jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('unavailable'));

    await expect(openExternalUrl('https://example.com/book')).resolves.toBe(false);
  });
});
