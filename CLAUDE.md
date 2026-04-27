# CLAUDE.md

This file provides context and guidance for AI assistants working in this repository.

## Project Overview

**BooksCompare** is a monorepo for a book price comparison app targeting Taiwan bookstores. It is being rewritten from a legacy Firebase/Express project into a modern monorepo with:

- `apps/api` — Cloudflare Workers backend (Hono + Wrangler)
- `apps/mobile` — Expo SDK 54 React Native mobile app (iOS-first)
- `packages/contracts` — Shared API response contracts (TypeScript types)
- `legacy/firebase/` — Old Firebase scraper code kept for reference only

## Monorepo Tooling

- **Package manager**: `pnpm` (v9.15.0) with workspaces
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

# API deployment
pnpm check:api        # Dry-run Wrangler deploy
pnpm deploy:api       # Deploy to Cloudflare Workers

# Mobile native
pnpm ios:mobile       # expo run:ios
pnpm android:mobile   # expo run:android
```

## Architecture Notes

### API (`apps/api`)

- Runtime: **Cloudflare Workers** via Wrangler
- Language: TypeScript (ESM)
- Tests: Node.js native test runner via `tsx`
- Current endpoints: `GET /`, `GET /health`, `GET /isbn/:id`, `GET /book/isbn/:id`
- The scraper layer is intentionally stubbed — the old Firebase parsers are not carried over blindly

### Mobile (`apps/mobile`)

- Framework: **Expo SDK 54** / React Native 0.81
- Navigation: React Navigation (native-stack + bottom-tabs)
- Data fetching: TanStack React Query
- UI: React Native Paper
- Camera/barcode: `expo-camera`
- Tests: Jest + jest-expo + `@testing-library/react-native`
- iOS-first; Android scaffolding is present but not the priority

### Contracts (`packages/contracts`)

- Pure TypeScript types shared between API and mobile
- No runtime dependencies

## Key Conventions

- All packages use **TypeScript**; strict mode is expected
- Shared types always go in `packages/contracts`, not duplicated across apps
- `EXPO_PUBLIC_API_BASE_URL` env var points the mobile app at a local or deployed API
- Legacy code in `legacy/` is read-only reference; do not import from it in new code
