import { useReservedRegions } from 'react-native-reserved-regions';

import { EmptyState } from './EmptyState';
import { renderWithProviders } from '../test/test-utils';
import { setTestWindowSize, WIDE_WINDOW } from '../test/windowSize';

const mockUseReservedRegions = jest.mocked(useReservedRegions);

describe('EmptyState', () => {
  afterEach(() => {
    mockUseReservedRegions.mockReturnValue([]);
  });

  it('pads its content inside the safe area on a phone-width window', async () => {
    const screen = await renderWithProviders(
      <EmptyState icon="sad-outline" title="Nothing here" description="Try again" />,
      { safeAreaInsets: { left: 84 } }
    );

    expect(screen.getByText('Nothing here').parent).toHaveStyle({
      paddingLeft: 108,
      paddingRight: 24,
    });
  });

  it('moves its content beside an active fold instead of across it', async () => {
    setTestWindowSize(WIDE_WINDOW);
    mockUseReservedRegions.mockReturnValue([
      { kind: 'division', frame: { x: 430, y: 0, width: 40, height: 760 }, occludesContent: false },
    ]);

    const screen = await renderWithProviders(
      <EmptyState icon="sad-outline" title="Nothing here" description="Try again" />,
      { safeAreaInsets: { right: 84 } }
    );

    expect(screen.getByText('Nothing here').parent).toHaveStyle({
      paddingLeft: 24,
      paddingRight: WIDE_WINDOW.width - 430 + 24,
    });
  });
});
