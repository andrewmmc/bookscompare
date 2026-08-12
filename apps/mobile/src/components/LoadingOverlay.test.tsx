import { LoadingOverlay } from './LoadingOverlay';
import { renderWithProviders } from '../test/test-utils';

describe('LoadingOverlay', () => {
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
});
