# CLAUDE.md

This file provides context and guidance for AI assistants working in this repository.

## Project Overview

**BooksCompare** is a monorepo for a book price comparison app targeting Taiwan bookstores with:

- `apps/api` — Cloudflare Workers backend (Wrangler, no framework)
- `apps/mobile` — Expo SDK 54 React Native mobile app (iOS-first)
- `packages/contracts` — Shared API response contracts (TypeScript types)

## Monorepo Tooling

- **Package manager**: `pnpm` (v9.15.0) with workspaces (`apps/*`, `packages/*`)
- **Node**: `>=20` (see `.nvmrc`)
- **Linter**: ESLint (config at `eslint.config.mjs`)
- **Formatter**: Prettier (config at `.prettierrc.json`)
- **Git hooks**: Lefthook — runs Prettier + ESLint on pre-commit, typecheck on pre-push

## Common Commands

```bash
# Install dependencies
pnpm install

# Development
pnpm dev:api          # Start Cloudflare Worker locally (port 8787)
pnpm dev:mobile       # Start Expo dev server (expo start --clear)

# Type checking (all packages)
pnpm typecheck

# Linting & formatting
pnpm lint             # ESLint
pnpm lint:fix         # ESLint with auto-fix
pnpm format           # Prettier write
pnpm format:check     # Prettier check

# Testing
pnpm test             # API tests (tsx --test)
pnpm test:mobile      # Mobile tests (Jest)

# Full verify pipeline
pnpm verify           # typecheck + lint + test + test:mobile + check:api

# Focused audits
pnpm audit:privacy              # Show analytics/privacy-related SDK usage
pnpm validate:appstore-images   # Ensure App Store preview PNGs are accepted RGB/no-alpha sizes

# API deployment
pnpm check:api        # Dry-run Wrangler deploy
pnpm deploy:api       # Deploy to Cloudflare Workers

# Mobile native
pnpm ios:mobile       # expo run:ios
pnpm android:mobile   # expo run:android
```

## Project Map

Use this map to avoid rediscovering common ownership paths:

### Mobile app (`apps/mobile`)

- App entry: `src/App.tsx`
- Home/search flow: `src/screens/home/`
- Barcode scanning: `src/screens/home/BarcodeScannerScreen.tsx`
- Search results and ISBN/title branching: `src/screens/home/SearchResultScreen.tsx`
- Book details: `src/screens/home/BookDetailScreen.tsx`
- Navigation stacks and params: `src/navigation/`
- Feature flags: `src/config/featureFlags.ts`
- API client/hooks: `src/api/`
- Localization strings: `src/i18n/`
- Theme tokens: `src/theme/`
- Test utilities: `src/test/test-utils.tsx`

Useful focused checks:

```bash
pnpm --filter @bookscompare/mobile typecheck
pnpm --filter @bookscompare/mobile test -- HomeScreen.test.tsx SearchResultScreen.test.tsx
```

### API (`apps/api`)

- Worker entry/router: `src/index.ts`
- Response helpers: `src/lib/responses.ts`
- ISBN helpers: `src/lib/isbn.ts`
- Provider registry: `src/providers/registry.ts`
- Provider implementations: `src/providers/`
- Source adapters/scrapers: `src/sources/`
- Fan-out services: `src/services/`
- Tests: `test/*.test.ts`

Useful focused checks:

```bash
pnpm --filter @bookscompare/api typecheck
pnpm --filter @bookscompare/api test
```

### Shared contracts (`packages/contracts`)

- Public API types and source IDs: `src/index.ts`
- Put shared API response/request types here instead of duplicating them in apps.

Useful focused check:

```bash
pnpm --filter @bookscompare/contracts typecheck
```

### App Store preview assets

- Generator: `scripts/generate-appstore-previews.sh`
- Raw screenshots input: `assets/screenshot-*.png`
- Generated output: `appstore-previews/preview-*.png`
- App Store PNGs must be RGB with no alpha channel. The generator intentionally uses `-alpha remove -alpha off -define png:color-type=2`.

Useful checks:

```bash
./scripts/generate-appstore-previews.sh
pnpm validate:appstore-images
```

## Architecture Notes

### API (`apps/api`)

- Runtime: **Cloudflare Workers** via Wrangler (no Hono / framework — plain `fetch` handler in `src/index.ts`)
- Language: TypeScript (ESM)
- Tests: Node.js native test runner via `tsx` (`test/*.test.ts`)
- Endpoints:
  - `GET /` — service banner
  - `GET /health` — health check
  - `GET /isbn/:id` and `GET /book/isbn/:id` — ISBN lookup (validates ISBN-10 / ISBN-13)
  - `GET /search?q=<title>` — title search (max 100 chars)
- Rate limit: `ISBN_LIMITER` binding (10 req / 10s) keyed per IP (`cf-connecting-ip`); separate keys for `isbn:` and `search:`
- Caching: successful lookups are stored in the Workers default cache with `cache-control: public, max-age=0, s-maxage=1800`; responses set `x-bookscompare-cache: HIT|MISS`. Responses with any source `status === 'error'` are not cached.
- Source adapters live in `src/sources/` and per-source providers in `src/providers/` with a `registry.ts`. Service-level fan-out lives in `src/services/`.
- Supported sources: 博客來 (`books-com-tw`), 金石堂 (`kingstone`), 城邦讀書花園 (`cite`), 誠品線上 (`eslite`).

### Mobile (`apps/mobile`)

- Framework: **Expo SDK 54** / React Native 0.81 / React 19
- Navigation: React Navigation (native-stack + bottom-tabs)
- Data fetching: TanStack React Query
- UI: React Native Paper + `@expo/vector-icons` + `@expo/react-native-action-sheet`
- Camera/barcode: `expo-camera`
- Web views: `react-native-webview`
- Localization: `expo-localization` (zh-TW / en strings under `src/i18n/`)
- Analytics: `posthog-react-native`, initialized in `App.tsx` via `src/analytics/`
- Tests: Jest + jest-expo + `@testing-library/react-native`
- Env: reads `apps/mobile/.env`; `EXPO_PUBLIC_API_BASE_URL` points at the API (defaults to `http://localhost:8787`)
- iOS-first; Android scaffolding is present but not the priority

### Contracts (`packages/contracts`)

- Pure TypeScript types shared between API and mobile (no runtime deps)
- Key exports: `BOOK_SOURCES`, `BookSourceId`, `BookOffer`, `SourceState`, `LookupQuery`, `LookupResponse`, `ApiErrorResponse`
- Error codes: `INVALID_ISBN | INVALID_QUERY | METHOD_NOT_ALLOWED | NOT_FOUND | RATE_LIMITED`

## Key Conventions

- All packages use **TypeScript**; strict mode is expected.
- Shared types always go in `packages/contracts`, not duplicated across apps.
- Source IDs must match `BOOK_SOURCES` in the contracts package.
- `EXPO_PUBLIC_API_BASE_URL` env var points the mobile app at a local or deployed API.
- Only `GET` is supported by the API; non-GET requests return `METHOD_NOT_ALLOWED`.

## Verification Tiers

Prefer the narrowest check that meaningfully validates the change:

- **Docs/content only**: review `git diff`; no typecheck unless code changed.
- **Root scripts/config**: run the affected script/command plus `pnpm format:check` when formatting may be affected.
- **API-only change**: run `pnpm --filter @bookscompare/api typecheck` and `pnpm --filter @bookscompare/api test`.
- **Mobile localized change**: run `pnpm --filter @bookscompare/mobile typecheck` and the nearest focused Jest test(s).
- **Shared contracts/navigation/cross-package change**: run `pnpm typecheck` plus relevant API/mobile tests.
- **Before push**: Lefthook runs Prettier/ESLint on commit and typecheck on push; avoid duplicating the full pipeline unless the change is broad or a focused check failed earlier.

## Git Workflow Defaults

- After completing a coherent code change, commit locally using Conventional Commits.
- Do not push unless the user asks to push, ship, publish, or create/update a PR.
- For exploratory/read-only tasks, do not commit unless files were intentionally changed.
- Before staging, inspect `git status --short` and the relevant diff; never stage secrets, `.env` files, or unrelated user changes.
- Batch read-only git context when possible to reduce tool overhead:

```bash
{
  echo "## status"; git status --short
  echo "## diff stat"; git diff --stat
  echo "## branch"; git branch --show-current
  echo "## recent"; git log --oneline -5
}
```

## Known Productivity Gotchas

- `pnpm install` may exit non-zero on first run because `lefthook install` conflicts with existing hook paths. Use `pnpm install --ignore-scripts` if a clean install exit code is required.
- Mobile simulators/emulators are not available in headless cloud VMs. Mobile Jest tests run headlessly.
- `apps/mobile/.env` must exist before running mobile commands; copy from `apps/mobile/.env.example` if needed.
- Editing Traditional Chinese text can fail if a patch relies on brittle exact multi-byte matches. Prefer smaller hunks with nearby ASCII anchors or inspect bytes/line content before retrying.
- App Store preview PNGs with alpha channels are rejected. Use `pnpm validate:appstore-images` after regenerating previews.
