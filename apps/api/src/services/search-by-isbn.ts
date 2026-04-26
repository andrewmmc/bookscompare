import { createDisabledSourceState, createLookupResponse } from '../lib/responses';
import { providers } from '../providers/registry';

import type { LookupResponse, SourceState } from '@bookscompare/contracts';
import type { BookProvider } from '../providers/types';

function isBookProvider(provider: (typeof providers)[number]): provider is BookProvider {
  return 'searchByIsbn' in provider;
}

export async function searchBooksByIsbn(isbn: string): Promise<LookupResponse> {
  const data: LookupResponse['data'] = [];
  const sources: SourceState[] = [];
  let liveScraping = false;
  let message: string | undefined;
  const providerResults = await Promise.all(
    providers.map(async (provider) => {
      if (!provider.enabled || !isBookProvider(provider)) {
        return {
          provider,
          status: 'disabled' as const,
        };
      }

      try {
        const offers = await provider.searchByIsbn(isbn, {
          timeoutMs: provider.timeoutMs,
        });

        return {
          provider,
          status: 'ready' as const,
          offers,
        };
      } catch (error) {
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
        ...(result.offers.length === 0
          ? { message: `No ${result.provider.name} search results matched this ISBN.` }
          : {}),
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
    message = 'One or more providers failed during ISBN search.';
  }

  return createLookupResponse({
    isbn,
    data,
    sources,
    liveScraping,
    ...(message ? { message } : {}),
  });
}
