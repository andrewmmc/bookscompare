import { PriceTag } from './PriceTag';
import { renderWithProviders } from '../test/test-utils';

describe('PriceTag', () => {
  it('renders formatted price text', async () => {
    const screen = await renderWithProviders(<PriceTag currency="TWD" price={12345} />);

    expect(screen.getByText('TWD')).toBeOnTheScreen();
    expect(screen.getByText('12,345')).toBeOnTheScreen();
  });

  it('renders a discount chip when discountRate is present', async () => {
    const screen = await renderWithProviders(
      <PriceTag currency="TWD" price={280} discountRate={79} />
    );

    expect(screen.getByText('79折')).toBeOnTheScreen();
  });
});
