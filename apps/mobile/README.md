# BooksCompare Mobile

The mobile app lives here as an Expo SDK 54 workspace app with an iOS-first release target.

## Current feature set

- ISBN search by typing
- ISBN barcode scanning with `expo-camera`
- Search results rendered from `@bookscompare/contracts`
- In-app bookstore browsing with `react-native-webview`
- About page links routed through the shared web view screen
- Friendly empty/error states when the API or marketing pages are unavailable

## Stack

- Expo SDK 54 / React Native 0.81
- TypeScript
- React Navigation 7
- React Native Paper
- TanStack Query
- Jest + React Native Testing Library

## Commands

From the repository root:

```bash
pnpm dev:mobile
pnpm ios:mobile
pnpm test:mobile
pnpm typecheck
```

From `apps/mobile/` directly:

```bash
pnpm dev
pnpm ios
pnpm prebuild:ios
pnpm test
pnpm typecheck
```

## Environment

`app.config.ts` reads these public Expo variables:

- `EXPO_PUBLIC_API_BASE_URL` — overrides the default deployed Worker URL
- `EXPO_PUBLIC_POSTHOG_KEY` — reserved for a future analytics provider; currently unused

## iOS notes

- Bundle identifier: `com.andrewmmc.BookPriceApp`
- Deployment target: iOS 17.0
- Locale baseline: `zh_Hant_TW`
- `pnpm prebuild:ios` successfully generates the native iOS project from the current Expo config
- CocoaPods must be available locally to finish native dependency installation during prebuild/run flows

## EAS profiles

`eas.json` currently defines:

- `development`
- `simulator`
- `preview`
- `production`
