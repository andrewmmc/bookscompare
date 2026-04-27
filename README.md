# BooksCompare

BooksCompare is being rewritten from an old Firebase function project into a monorepo with:

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

The new API currently provides:

- `GET /`
- `GET /health`
- `GET /isbn/:id`
- `GET /book/isbn/:id` for legacy compatibility

Right now the worker validates ISBN input and returns an empty placeholder response while the scraper layer is rebuilt. This is intentional: the legacy parsers have not been maintained for a long time, so they are not being carried over blindly.
The mobile UI already handles that state and shows a user-facing notice when live scraping is unavailable.

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

### Local mobile development

Start the Cloudflare Worker locally in one terminal:

```bash
pnpm dev:api
```

Then start the mobile Expo dev server in another terminal. Point the app at your local API first if you do not want to use the deployed Worker:

```bash
EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8787 pnpm dev:mobile
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
- Legacy Firebase scraper code remains in `legacy/firebase/functions/` so the old parsing logic can be ported carefully later.

## Legacy Project Notes

The original project was a Firebase + Express API that scraped book pricing from several Taiwan bookstores. That code is still in this repo under `legacy/firebase/` for reference, but it is no longer the direction for the new runtime.

## License

Apache License 2.0. See [LICENSE.md](./LICENSE.md).
