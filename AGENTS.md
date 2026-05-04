# AGENTS.md

## Cursor Cloud specific instructions

### Overview

BooksCompare is a pnpm monorepo with three packages. See `CLAUDE.md` and `README.md` for full command reference. Key commands: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm test:mobile`, `pnpm dev:api`.

### Services

| Service                 | Command           | Port | Notes                                                                                  |
| ----------------------- | ----------------- | ---- | -------------------------------------------------------------------------------------- |
| API (Cloudflare Worker) | `pnpm dev:api`    | 8787 | Stateless; no DB or external secrets needed locally. Wrangler simulates rate-limiting. |
| Mobile (Expo)           | `pnpm dev:mobile` | 8081 | Requires iOS Simulator or physical device; not runnable headlessly in Cloud Agent VMs. |

### Gotchas

- **`pnpm install` exits non-zero** on first run because the `prepare` script runs `lefthook install`, which conflicts with the Cursor agent hooks path (`core.hooksPath`). Dependencies are still installed correctly. Use `pnpm install --ignore-scripts` if a clean exit code is needed, then run build-related postinstall scripts separately if required (e.g. `npx esbuild --version` or `npx wrangler --version` to trigger lazy native installs).
- **Mobile app cannot be tested in Cloud Agent VMs** — there is no iOS Simulator or Android emulator. The mobile Jest tests (`pnpm test:mobile`) run fine headlessly.
- **`apps/mobile/.env`** must exist before running mobile commands. Copy from `.env.example`: `cp apps/mobile/.env.example apps/mobile/.env`.
- **Node.js >=20 and pnpm 9.15.0** are required (see `.nvmrc` and `packageManager` field in root `package.json`).
