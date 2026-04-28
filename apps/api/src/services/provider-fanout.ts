import { logProviderResult } from '../lib/logger';
import { createDisabledSourceState, createLookupResponse } from '../lib/responses';
import { providers } from '../providers/registry';

import type { LookupQuery, LookupResponse, SourceState } from '@bookscompare/contracts';
import type { BookProvider } from '../providers/types';

type ProviderSearchMethod = 'searchByIsbn' | 'searchByTitle';

interface RunProviderSearchInput {
  query: LookupQuery;
  method: ProviderSearchMethod;
  value: string;
  failureMessage: string;
  emptyMessage: (providerName: string) => string;
}

function isBookProvider(provider: (typeof providers)[number]): provider is BookProvider {
  return 'searchByIsbn' in provider && 'searchByTitle' in provider;
}

export async function runProviderSearch({
  query,
  method,
  value,
  failureMessage,
  emptyMessage,
}: RunProviderSearchInput): Promise<LookupResponse> {
  const data: LookupResponse['data'] = [];
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
        const offers = await provider[method](value, {
          timeoutMs: provider.timeoutMs,
        });
        const durationMs = Date.now() - startedAt;

        logProviderResult({
          providerId: provider.id,
          status: 'ready',
          durationMs,
          offerCount: offers.length,
        });

        return {
          provider,
          status: 'ready' as const,
          offers,
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
      data.push(...result.offers);
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

  return createLookupResponse({
    query,
    data,
    sources,
    liveScraping,
    ...(message ? { message } : {}),
  });
}
