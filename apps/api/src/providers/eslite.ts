import { fetchEsliteOffers } from '../sources/eslite';

import type { BookProvider } from './types';

export const esliteProvider: BookProvider = {
  id: 'eslite',
  name: '誠品線上',
  enabled: true,
  usesJsonApi: true,
  timeoutMs: 8000,
  searchByIsbn: fetchEsliteOffers,
  searchByTitle: fetchEsliteOffers,
};
