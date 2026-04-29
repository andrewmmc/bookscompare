# BooksCompare

BooksCompare is a monorepo for a book price comparison app targeting Taiwan bookstores.

- `apps/api` — Cloudflare Workers backend that aggregates live offers
- `apps/mobile` — Expo SDK 54 mobile app (iOS-first)
- `packages/contracts` — Shared API response contracts (TypeScript types)

## Current Status

The mobile app currently includes:

- ISBN lookup by typing
- ISBN barcode scanning with `expo-camera`
- Title search backed by the `/search` endpoint
- Search result cards backed by `@bookscompare/contracts`
- In-app bookstore web views with a friendly 404 state
- Localized UI (Traditional Chinese / English) via `expo-localization`
- PostHog analytics
- About pages and placeholder marketing-site links

The API currently provides:

- `GET /` — service banner
- `GET /health` — health check
- `GET /isbn/:id` and `GET /book/isbn/:id` — ISBN lookup across supported sources
- `GET /search?q=<title>` — title search across supported sources

The Cloudflare Worker fans out to live providers for 博客來, 金石堂, 城邦讀書花園, and 誠品線上, applies a rate limit (`ISBN_LIMITER`, 10 requests / 10 seconds per IP), and caches successful lookups in the Workers cache (`s-maxage=1800`). Responses include an `x-bookscompare-cache: HIT|MISS` header.

## Monorepo Layout

```txt
apps/
  api/        # Cloudflare Worker (Wrangler)
    src/
      lib/        # ISBN, HTML, fetch, responses, logging helpers
      providers/  # Per-bookstore lookup providers + registry
      services/   # search-by-isbn, search-by-title, provider fan-out
      sources/    # Per-bookstore scraping/source adapters
      index.ts
  mobile/     # Expo SDK 54 app
    src/
      analytics/  # PostHog wiring
      api/        # API client
      components/
      i18n/       # zh-TW / en strings
      lib/
      navigation/ # React Navigation stacks/tabs
      screens/    # home, about, common
      theme/
packages/
  contracts/  # Shared TS types (BookOffer, LookupResponse, ApiErrorResponse, ...)
```

## Getting Started

Install dependencies:

```bash
pnpm install
```

### Local mobile development

Start the Cloudflare Worker locally in one terminal:

```bash
pnpm dev:api
```

Then start the mobile Expo dev server in another terminal. The mobile app reads `apps/mobile/.env` (copy `.env.example` first); by default it points at `http://localhost:8787`:

```bash
pnpm dev:mobile
```

Run the mobile app on iOS:

```bash
pnpm ios:mobile
```

If you are working inside `apps/mobile/` directly, the equivalent commands are:

```bash
pnpm dev
pnpm ios
pnpm prebuild:ios
```

Notes:

- `pnpm dev:mobile` runs `expo start --clear`
- `pnpm ios:mobile` runs `expo run:ios`
- Xcode / CocoaPods are required for native iOS flows
- If Xcode is missing the simulator runtime, install it with `xcodebuild -downloadPlatform iOS`

### Verification

Typecheck the workspace:

```bash
pnpm typecheck
```

Run API tests:

```bash
pnpm test
```

Run the mobile tests:

```bash
pnpm test:mobile
```

Dry-run the Cloudflare Worker deployment:

```bash
pnpm check:api
```

Run the full verify pipeline (typecheck + lint + tests + worker check):

```bash
pnpm verify
```

## Deployment

Deploy the API to Cloudflare Workers:

```bash
pnpm deploy:api
```

The worker is configured in `apps/api/wrangler.toml`, including the `ISBN_LIMITER` rate limit binding (10 requests per 10 seconds, keyed per IP).

## Conventions

- Shared response contracts live in `packages/contracts`; never duplicate types across apps.
- Source IDs are pinned in `BOOK_SOURCES` (`books-com-tw`, `kingstone`, `cite`, `eslite`).
- The mobile app is iOS-first, but its Expo config keeps Android scaffolding viable for later.

## License

MIT License. See [LICENSE.md](./LICENSE.md).
