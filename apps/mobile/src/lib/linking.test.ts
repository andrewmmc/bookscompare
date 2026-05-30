import { Linking } from 'react-native';

import { openExternalUrl } from './linking';

describe('openExternalUrl', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('delegates URL opening to React Native Linking', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);

    await openExternalUrl('https://example.com/book');

    expect(openURL).toHaveBeenCalledWith('https://example.com/book');
  });
});
