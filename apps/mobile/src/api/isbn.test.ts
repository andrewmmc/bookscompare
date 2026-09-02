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
        book: null,
        sources: [],
        meta: { liveScraping: false, requestedAt: '2026-08-12T00:00:00.000Z' },
      }),
    } as Response);

    const response = await lookupIsbn('9781402894626');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://bookscompare-api.mmc.dev/isbn/9781402894626',
      expect.objectContaining({
        headers: { 'Accept-Language': 'zh-TW' },
        signal: expect.any(AbortSignal),
      })
    );
    expect('isbn' in response.query && response.query.isbn).toBe('9781402894626');
  });

  it('throws ApiError on non-ok responses', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'server error',
    } as Response);

    await expect(lookupIsbn('9781402894626')).rejects.toBeInstanceOf(ApiError);
  });

  it('rejects malformed successful responses', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ query: { isbn: '9781402894626' }, book: 'not-a-book' }),
    } as Response);

    await expect(lookupIsbn('9781402894626')).rejects.toMatchObject({
      status: 502,
      message: 'API returned an invalid response',
    });
  });

  it('rejects semantically invalid response metadata', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        query: { isbn: '9781402894626' },
        book: null,
        sources: [],
        meta: { liveScraping: false, requestedAt: 'not-a-date' },
      }),
    } as Response);

    await expect(lookupIsbn('9781402894626')).rejects.toMatchObject({ status: 502 });
  });
});
