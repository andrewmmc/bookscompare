import { searchByTitle } from './title';

describe('searchByTitle', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('requests the encoded search endpoint and returns parsed json', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        query: { title: '哈利波特 & magic' },
        results: [],
        sources: [],
        meta: { liveScraping: false, requestedAt: 'now' },
      }),
    } as Response);

    const response = await searchByTitle('哈利波特 & magic');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://bookscompare-api.mmc.dev/search?q=%E5%93%88%E5%88%A9%E6%B3%A2%E7%89%B9%20%26%20magic',
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
    expect('title' in response.query && response.query.title).toBe('哈利波特 & magic');
  });
});
