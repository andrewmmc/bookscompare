import { fetchEsliteOffers } from '../sources/eslite';

import { DEFAULT_PROVIDER_TIMEOUT_MS, type BookProvider } from './types';

export const esliteProvider: BookProvider = {
  id: 'eslite',
  name: '誠品線上',
  enabled: true,
  timeoutMs: DEFAULT_PROVIDER_TIMEOUT_MS,
  searchByIsbn: fetchEsliteOffers,
  searchByTitle: fetchEsliteOffers,
};
