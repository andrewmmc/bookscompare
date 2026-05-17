import { fireEvent } from '@testing-library/react-native';

import { AboutScreen } from './AboutScreen';
import { openExternalUrl } from '../../lib/linking';
import { renderWithProviders } from '../../test/test-utils';

jest.mock('../../lib/linking', () => ({
  openExternalUrl: jest.fn(),
}));

describe('AboutScreen', () => {
  beforeEach(() => {
    jest.mocked(openExternalUrl).mockReset();
  });

  it('opens in-app links in the webview screen', () => {
    const navigation = {
      navigate: jest.fn(),
    };

    const screen = renderWithProviders(
      <AboutScreen
        navigation={navigation as never}
        route={{ key: 'About', name: 'About' } as never}
      />
    );

    fireEvent.press(screen.getByText('使用條款及私隱政策'));

    expect(navigation.navigate).toHaveBeenCalledWith('AboutWebView', {
      title: '使用條款及私隱政策',
      url: 'https://bookscompare.mmc.dev/privacy',
    });
  });

  it('hides disclaimer and opens feedback on GitHub', () => {
    const navigation = {
      navigate: jest.fn(),
    };

    const screen = renderWithProviders(
      <AboutScreen
        navigation={navigation as never}
        route={{ key: 'About', name: 'About' } as never}
      />
    );

    expect(screen.queryByText('免責聲明')).toBeNull();

    fireEvent.press(screen.getByText('提交意見'));

    expect(navigation.navigate).not.toHaveBeenCalled();
    expect(openExternalUrl).toHaveBeenCalledWith(
      'https://github.com/andrewmmc/bookscompare/issues'
    );
  });
});
