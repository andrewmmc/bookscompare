import { fetchBooksComTwOffers } from '../sources/books-com-tw';
import { fetchCiteOffers } from '../sources/cite';
import { fetchEsliteOffers } from '../sources/eslite';
import { fetchKingstoneOffers } from '../sources/kingstone';
import { probeKoboTw } from './kobo-tw';

import type { BookOffer } from '@bookscompare/contracts';
import type { KoboProbeOffer } from './kobo-tw';

export const PROBE_PROVIDER_IDS = [
  'books-com-tw',
  'kingstone',
  'cite',
  'eslite',
  'kobo-tw',
] as const;

export type ProbeProviderId = (typeof PROBE_PROVIDER_IDS)[number];

export interface ProviderProbeResult {
  providerId: ProbeProviderId;
  query: string;
  ok: boolean;
  durationMs: number;
  offerCount: number;
  offers: Array<BookOffer | KoboProbeOffer>;
  error?: string;
  transport?: {
    status: number;
    finalUrl: string;
    challenged: boolean;
    pageKind: 'challenge' | 'detail' | 'search' | 'unknown';
    missingRequiredFields: string[];
  };
}

const standardProbes: Record<
  Exclude<ProbeProviderId, 'kobo-tw'>,
  (query: string) => Promise<BookOffer[]>
> = {
  'books-com-tw': fetchBooksComTwOffers,
  kingstone: fetchKingstoneOffers,
  cite: fetchCiteOffers,
  eslite: fetchEsliteOffers,
};

export function isProbeProviderId(value: string): value is ProbeProviderId {
  return (PROBE_PROVIDER_IDS as readonly string[]).includes(value);
}

export async function probeProvider(
  providerId: ProbeProviderId,
  query: string
): Promise<ProviderProbeResult> {
  const startedAt = Date.now();

  try {
    if (providerId === 'kobo-tw') {
      const result = await probeKoboTw(query);
      const ok = result.status < 400 && !result.challenged;

      return {
        providerId,
        query,
        ok,
        durationMs: Date.now() - startedAt,
        offerCount: result.offers.length,
        offers: result.offers,
        ...(!ok ? { error: `Kobo returned ${result.status} (${result.pageKind}).` } : {}),
        transport: {
          status: result.status,
          finalUrl: result.finalUrl,
          challenged: result.challenged,
          pageKind: result.pageKind,
          missingRequiredFields: result.missingRequiredFields,
        },
      };
    }

    const offers = await standardProbes[providerId](query);

    return {
      providerId,
      query,
      ok: true,
      durationMs: Date.now() - startedAt,
      offerCount: offers.length,
      offers,
    };
  } catch (error) {
    return {
      providerId,
      query,
      ok: false,
      durationMs: Date.now() - startedAt,
      offerCount: 0,
      offers: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
