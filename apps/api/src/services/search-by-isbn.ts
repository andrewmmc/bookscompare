import { createDisabledSourceState, createLookupResponse } from '../lib/responses'
import { providers } from '../providers/registry'

import type { LookupResponse, SourceState } from '@bookscompare/contracts'
import type { BookProvider } from '../providers/types'

function isBookProvider(provider: (typeof providers)[number]): provider is BookProvider {
  return 'searchByIsbn' in provider
}

export async function searchBooksByIsbn(isbn: string): Promise<LookupResponse> {
  const data: LookupResponse['data'] = []
  const sources: SourceState[] = []
  let liveScraping = false
  let message: string | undefined

  for (const provider of providers) {
    if (!provider.enabled || !isBookProvider(provider)) {
      sources.push(createDisabledSourceState(provider.id))
      continue
    }

    try {
      const offers = await provider.searchByIsbn(isbn)

      data.push(...offers)
      sources.push({
        id: provider.id,
        name: provider.name,
        status: 'ready',
        ...(offers.length === 0 ? { message: `No ${provider.name} search results matched this ISBN.` } : {}),
      })
      liveScraping = true
    } catch (error) {
      sources.push({
        id: provider.id,
        name: provider.name,
        status: 'error',
        message: error instanceof Error ? error.message : `Unexpected ${provider.name} parser error.`,
      })
      message = 'One or more providers failed during ISBN search.'
    }
  }

  return createLookupResponse({
    isbn,
    data,
    sources,
    liveScraping,
    ...(message ? { message } : {}),
  })
}
