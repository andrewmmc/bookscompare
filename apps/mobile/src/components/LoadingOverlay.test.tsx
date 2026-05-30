import { LoadingOverlay } from './LoadingOverlay';
import { renderWithProviders } from '../test/test-utils';

describe('LoadingOverlay', () => {
  it('renders the default loading label', () => {
    const screen = renderWithProviders(<LoadingOverlay />);

    expect(screen.getByText('載入中…')).toBeOnTheScreen();
  });

  it('renders correctly in dark mode', () => {
    const screen = renderWithProviders(<LoadingOverlay />, { scheme: 'dark' });

    expect(screen.getByText('載入中…')).toBeOnTheScreen();
  });

  it('omits the label when an empty string is provided', () => {
    const screen = renderWithProviders(<LoadingOverlay label="" />);

    expect(screen.queryByText('載入中…')).toBeNull();
  });
});
