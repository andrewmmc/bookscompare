import { ApiError } from './client';
import { lookupIsbn } from './isbn';

describe('lookupIsbn', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('requests the isbn endpoint and returns parsed json', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        query: { isbn: '9781402894626' },
        data: [],
        sources: [],
        meta: { liveScraping: false, requestedAt: 'now' },
      }),
    } as Response);

    const response = await lookupIsbn('9781402894626');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://bookscompare-api.andrewmmc.workers.dev/isbn/9781402894626'
    );
    expect(response.query.isbn).toBe('9781402894626');
  });

  it('throws ApiError on non-ok responses', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'server error',
    } as Response);

    await expect(lookupIsbn('9781402894626')).rejects.toBeInstanceOf(ApiError);
  });
});
