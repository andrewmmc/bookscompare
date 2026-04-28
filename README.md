# BooksCompare

BooksCompare is a monorepo with:

- `apps/api` for the backend service
- `apps/mobile` for the Expo-based mobile app
- `packages/contracts` for shared API contracts

## Current Status

The new backend target is Cloudflare Workers so the service can stay on a free account, and the mobile client now runs as an Expo SDK 54 app in `apps/mobile`.

The mobile app currently includes:

- ISBN lookup by typing
- ISBN barcode scanning with `expo-camera`
- Search result cards backed by `@bookscompare/contracts`
- In-app bookstore web views with a friendly 404 state
- About pages and placeholder marketing-site links

The API currently provides:

- `GET /`
- `GET /health`
- `GET /isbn/:id`
- `GET /book/isbn/:id`
- `GET /search?q=<title>`

Right now the worker validates ISBN input and returns an empty placeholder response while the scraper layer is rebuilt.
The mobile UI already handles that state and shows a user-facing notice when live scraping is unavailable.

## Monorepo Layout

```txt
apps/
  api/
  mobile/
packages/
  contracts/
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

Typecheck the workspace:

```bash
pnpm typecheck
```

Run the mobile tests:

```bash
pnpm test:mobile
```

Dry-run the Cloudflare Worker deployment:

```bash
pnpm check:api
```

## Migration Notes

- The new API is intentionally simple first.
- Shared response contracts live in `packages/contracts`.
- The mobile app is iOS-first, but its Expo config keeps Android scaffolding viable for later.

## License

Apache License 2.0. See [LICENSE.md](./LICENSE.md).
