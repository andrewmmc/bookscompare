import { logProviderResult } from '../lib/logger';
import { createDisabledSourceState } from '../lib/responses';
import { providers } from '../providers/registry';

import type { BookOffer, SourceState } from '@bookscompare/contracts';
import type { BookProvider } from '../providers/types';

type ProviderSearchMethod = 'searchByIsbn' | 'searchByTitle';

interface RunProviderSearchInput {
  method: ProviderSearchMethod;
  value: string;
  failureMessage: string;
  emptyMessage: (providerName: string) => string;
}

export interface ProviderFanoutResult {
  offers: BookOffer[];
  sources: SourceState[];
  liveScraping: boolean;
  message?: string;
}

function isBookProvider(provider: (typeof providers)[number]): provider is BookProvider {
  return 'searchByIsbn' in provider && 'searchByTitle' in provider;
}

export async function runProviderSearch({
  method,
  value,
  failureMessage,
  emptyMessage,
}: RunProviderSearchInput): Promise<ProviderFanoutResult> {
  const offers: BookOffer[] = [];
  const sources: SourceState[] = [];
  let liveScraping = false;
  let message: string | undefined;

  const providerResults = await Promise.all(
    providers.map(async (provider) => {
      if (!provider.enabled || !isBookProvider(provider)) {
        logProviderResult({
          providerId: provider.id,
          status: 'disabled',
          durationMs: 0,
        });
        return {
          provider,
          status: 'disabled' as const,
        };
      }

      const startedAt = Date.now();

      try {
        const providerOffers = await provider[method](value, {
          timeoutMs: provider.timeoutMs,
        });
        const durationMs = Date.now() - startedAt;

        logProviderResult({
          providerId: provider.id,
          status: 'ready',
          durationMs,
          offerCount: providerOffers.length,
        });

        return {
          provider,
          status: 'ready' as const,
          offers: providerOffers,
        };
      } catch (error) {
        const durationMs = Date.now() - startedAt;

        logProviderResult({
          providerId: provider.id,
          status: 'error',
          durationMs,
          message: error instanceof Error ? error.message : String(error),
        });

        return {
          provider,
          status: 'error' as const,
          error,
        };
      }
    })
  );

  for (const result of providerResults) {
    if (result.status === 'disabled') {
      sources.push(createDisabledSourceState(result.provider.id));
      continue;
    }

    if (result.status === 'ready') {
      offers.push(...result.offers);
      sources.push({
        id: result.provider.id,
        name: result.provider.name,
        status: 'ready',
        ...(result.offers.length === 0 ? { message: emptyMessage(result.provider.name) } : {}),
      });
      liveScraping = true;
      continue;
    }

    sources.push({
      id: result.provider.id,
      name: result.provider.name,
      status: 'error',
      message:
        result.error instanceof Error
          ? result.error.message
          : `Unexpected ${result.provider.name} parser error.`,
    });
    message = failureMessage;
  }

  return {
    offers,
    sources,
    liveScraping,
    ...(message ? { message } : {}),
  };
}
