import { fetchCiteOffers } from '../sources/cite';

import { DEFAULT_PROVIDER_TIMEOUT_MS, type BookProvider } from './types';

export const citeProvider: BookProvider = {
  id: 'cite',
  name: '城邦讀書花園',
  enabled: true,
  timeoutMs: DEFAULT_PROVIDER_TIMEOUT_MS,
  searchByIsbn: fetchCiteOffers,
  searchByTitle: fetchCiteOffers,
};
