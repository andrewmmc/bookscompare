# AGENTS.md

## Cursor Cloud specific instructions

### Overview

BooksCompare is a pnpm monorepo with three packages (`apps/api`, `apps/mobile`, `packages/contracts`). See `CLAUDE.md` and `README.md` for full command reference. Key commands: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm test:mobile`, `pnpm dev:api`, `pnpm verify` (runs typecheck + lint + tests + `check:api`).

### Project map

- Mobile screens: `apps/mobile/src/screens/` (`home/`, `about/`, `common/`)
- Mobile navigation: `apps/mobile/src/navigation/`
- Mobile feature flags: `apps/mobile/src/config/featureFlags.ts`
- Mobile localization: `apps/mobile/src/i18n/`
- Mobile analytics: `apps/mobile/src/analytics/`
- Mobile theming: `apps/mobile/src/theme/`
- Mobile API client: `apps/mobile/src/api/`
- API worker/router: `apps/api/src/index.ts`
- API providers/scrapers: `apps/api/src/providers/`, `apps/api/src/sources/`
- API fan-out services: `apps/api/src/services/`
- API shared lib: `apps/api/src/lib/`
- Shared API contracts: `packages/contracts/src/index.ts`
- App Store previews: `scripts/generate-appstore-previews.sh`, `assets/screenshot-*.png`, `appstore-previews/preview-*.png`
- Release notes validation: `scripts/validate-release-notes.sh`
- Privacy audit: `scripts/audit-privacy.sh`

### Verification tiers

- Docs/content only: inspect `git diff`; no typecheck unless code changed.
- Root scripts/config: run the affected script/command.
- API-only: `pnpm --filter @bookscompare/api typecheck && pnpm --filter @bookscompare/api test`.
- Mobile localized change: `pnpm --filter @bookscompare/mobile typecheck` plus nearest focused Jest test(s).
- Shared contracts/navigation/cross-package: `pnpm typecheck` plus relevant API/mobile tests.
- Before push: lefthook already runs Prettier/ESLint on commit and typecheck on push; avoid duplicating the full pipeline unless needed.

### Services

| Service                 | Command           | Port | Notes                                                                                  |
| ----------------------- | ----------------- | ---- | -------------------------------------------------------------------------------------- |
| API (Cloudflare Worker) | `pnpm dev:api`    | 8787 | Stateless; no DB or external secrets needed locally. Wrangler simulates rate-limiting. |
| Mobile (Expo)           | `pnpm dev:mobile` | 8081 | Requires iOS Simulator or physical device; not runnable headlessly in Cloud Agent VMs. |

### Gotchas

- **`pnpm install` exits non-zero** on first run because the `prepare` script runs `lefthook install`, which conflicts with the Cursor agent hooks path (`core.hooksPath`). Dependencies are still installed correctly. Use `pnpm install --ignore-scripts` if a clean exit code is needed, then run build-related postinstall scripts separately if required (e.g. `npx esbuild --version` or `npx wrangler --version` to trigger lazy native installs).
- **Mobile app cannot be tested in Cloud Agent VMs** — there is no iOS Simulator or Android emulator. The mobile Jest tests (`pnpm test:mobile`) run fine headlessly.
- **`apps/mobile/.env`** must exist before running mobile commands. Copy from `.env.example`: `cp apps/mobile/.env.example apps/mobile/.env`.
- **App Store preview PNGs must be RGB/no-alpha** — run `pnpm validate:appstore-images` after regenerating previews. Apple rejects PNGs with alpha channels/transparency.
- **Traditional Chinese exact-match edits can be brittle** — prefer smaller hunks with stable ASCII anchors if patching Unicode-heavy text.
- **Node.js >=20 and pnpm 9.15.0** are required (see `.nvmrc` and `packageManager` field in root `package.json`).
