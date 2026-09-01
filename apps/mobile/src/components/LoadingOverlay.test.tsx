import { act, waitFor } from '@testing-library/react-native';

import { LoadingOverlay } from './LoadingOverlay';
import { i18n } from '../i18n';
import { renderWithProviders } from '../test/test-utils';

describe('LoadingOverlay', () => {
  afterEach(async () => {
    await act(() => i18n.changeLanguage('zh-TW'));
  });

  it('renders the default loading label', async () => {
    const screen = await renderWithProviders(<LoadingOverlay />);

    expect(screen.getByText('載入中…')).toBeOnTheScreen();
  });

  it('renders correctly in dark mode', async () => {
    const screen = await renderWithProviders(<LoadingOverlay />, { scheme: 'dark' });

    expect(screen.getByText('載入中…')).toBeOnTheScreen();
  });

  it('omits the label when an empty string is provided', async () => {
    const screen = await renderWithProviders(<LoadingOverlay label="" />);

    expect(screen.queryByText('載入中…')).toBeNull();
  });

  it('rerenders a mounted component when the language changes', async () => {
    const screen = await renderWithProviders(<LoadingOverlay />);

    expect(screen.getByText('載入中…')).toBeOnTheScreen();
    await act(() => i18n.changeLanguage('en'));
    await waitFor(() => expect(screen.getByText('Loading…')).toBeOnTheScreen());
  });
});
