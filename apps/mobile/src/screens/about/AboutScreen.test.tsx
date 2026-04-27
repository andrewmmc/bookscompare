import { fireEvent } from '@testing-library/react-native';

import { AboutScreen } from './AboutScreen';
import { renderWithProviders } from '../../test/test-utils';

describe('AboutScreen', () => {
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
});
