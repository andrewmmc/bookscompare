# BooksCompare

BooksCompare is being rewritten from an old Firebase function project into a monorepo with:

- `apps/api` for the backend service
- `apps/mobile` for the future mobile app
- `packages/contracts` for shared API contracts

## Current Status

The new backend target is Cloudflare Workers so the service can stay on a free account.

The new API currently provides:

- `GET /`
- `GET /health`
- `GET /isbn/:id`
- `GET /book/isbn/:id` for legacy compatibility

Right now the worker validates ISBN input and returns an empty placeholder response while the scraper layer is rebuilt. This is intentional: the legacy parsers have not been maintained for a long time, so they are not being carried over blindly.

## Monorepo Layout

```txt
apps/
  api/
  mobile/
legacy/
  firebase/
packages/
  contracts/
```

The old Firebase app now lives under `legacy/firebase/` so the workspace root stays focused on the new monorepo.

## Getting Started

Install dependencies:

```bash
pnpm install
```

Start the Cloudflare Worker locally:

```bash
pnpm dev:api
```

Typecheck the workspace:

```bash
pnpm typecheck
```

Dry-run the Cloudflare Worker deployment:

```bash
pnpm check:api
```

## Migration Notes

- The new API is intentionally simple first.
- Shared response contracts live in `packages/contracts`.
- The mobile app folder exists as a placeholder until the API shape settles.
- Legacy Firebase scraper code remains in `legacy/firebase/functions/` so the old parsing logic can be ported carefully later.

## Legacy Project Notes

The original project was a Firebase + Express API that scraped book pricing from several Taiwan bookstores. That code is still in this repo under `legacy/firebase/` for reference, but it is no longer the direction for the new runtime.

## License

Apache License 2.0. See [LICENSE.md](./LICENSE.md).
