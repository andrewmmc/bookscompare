import { fetchKingstoneOffers } from '../sources/kingstone';

import { KINGSTONE_PROVIDER_TIMEOUT_MS, type BookProvider } from './types';

export const kingstoneProvider: BookProvider = {
  id: 'kingstone',
  name: '金石堂',
  enabled: true,
  timeoutMs: KINGSTONE_PROVIDER_TIMEOUT_MS,
  searchByIsbn: fetchKingstoneOffers,
  searchByTitle: fetchKingstoneOffers,
};
