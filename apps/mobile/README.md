# BooksCompare Mobile

The mobile app lives here as an Expo SDK 54 workspace app with an iOS-first release target.

## Current feature set

- ISBN search by typing
- ISBN barcode scanning with `expo-camera`
- Search results rendered from `@bookscompare/contracts`
- In-app bookstore browsing with `react-native-webview`
- About page links routed through the shared web view screen
- Friendly empty/error states when the API or marketing pages are unavailable
- Bilingual UI (`zh-TW` primary, `en` secondary) driven by device locale
- Optional PostHog analytics — disabled at build time when no key is provided

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

## Local development flow

Copy the env template (one-time setup):

```bash
cp apps/mobile/.env.example apps/mobile/.env
```

Start the API in one terminal:

```bash
pnpm dev:api
```

Start Expo in another terminal — it auto-loads `apps/mobile/.env`:

```bash
pnpm dev:mobile
```

Then launch the iOS app:

```bash
pnpm ios:mobile
```

If you are already in `apps/mobile/`, use:

```bash
pnpm dev
pnpm ios
```

## Environment

Expo loads `apps/mobile/.env` automatically. See `.env.example` for the full list. `app.config.ts` reads:

- `EXPO_PUBLIC_API_BASE_URL` — BooksCompare API base URL (default: `http://localhost:8787` in dev)
- `EXPO_PUBLIC_POSTHOG_KEY` — PostHog project API key. Leave blank to disable analytics; otherwise the app initialises `posthog-react-native` on startup.
- `EXPO_PUBLIC_POSTHOG_HOST` — Optional PostHog host (defaults to `https://us.i.posthog.com`). Use `https://eu.i.posthog.com` or your self-hosted URL when needed.

> Testing on a physical iPhone? Set `EXPO_PUBLIC_API_BASE_URL=http://<your-mac-lan-ip>:8787` in `.env` so the device can reach the local Worker.

## iOS notes

- Bundle identifier: `com.andrewmmc.BookPriceApp`
- Deployment target: iOS 17.0
- Locale baseline: `zh_Hant_TW`
- `pnpm prebuild:ios` successfully generates the native iOS project from the current Expo config
- `xcodebuild` successfully builds the generated iOS project for `iphonesimulator`
- CocoaPods must be available locally to finish native dependency installation during prebuild/run flows

## EAS profiles

`eas.json` currently defines:

- `development`
- `simulator`
- `preview`
- `production`

## Localization

Strings live in [`src/i18n/dictionaries.ts`](./src/i18n/dictionaries.ts). The active locale is resolved at startup by `src/i18n/locale.ts` from `expo-localization`:

- `zh-TW` is the primary locale and the fallback for any unsupported device language.
- `en` is offered as a secondary locale for English (`en-*`) devices.

Re-export the resolved dictionary via `import { strings } from '../../i18n/strings'` from any screen or component. There is no runtime locale switcher — the app follows the device language.

When adding a new user-facing string:

1. Extend the `Dictionary` type in `dictionaries.ts`.
2. Provide both `zh-TW` and `en` values.
3. Reference the new key through `strings.<group>.<key>`.

## Analytics

Analytics goes through `src/analytics`. The provider is selected at module load time:

- If `EXPO_PUBLIC_POSTHOG_KEY` is set in the active build, the PostHog provider is used and `initAnalytics()` (called from `App.tsx`) constructs `posthog-react-native` with `captureAppLifecycleEvents: true`.
- Otherwise the no-op provider is used, so `track()` and `identify()` calls remain safe in development and in builds without an analytics key.

The PostHog SDK is `require()`d lazily so unit tests (which never call `initAnalytics`) do not need to mock the native module.

## TestFlight rollout

iOS releases are produced by the [`App Store Mobile Release`](../../.github/workflows/appstore-mobile.yml) workflow. It runs `eas build --platform ios --profile production --auto-submit`, so a successful run uploads the build to App Store Connect and triggers TestFlight processing automatically (typically 10–30 minutes).

### Required GitHub configuration

Set these in **Settings → Secrets and variables → Actions**:

| Name                               | Type     | Purpose                                                                          |
| ---------------------------------- | -------- | -------------------------------------------------------------------------------- |
| `EXPO_TOKEN`                       | Secret   | EAS access token (Expo account settings → Access tokens).                        |
| `EXPO_PUBLIC_POSTHOG_KEY`          | Secret   | PostHog key inlined into the build. Leave unset to ship with analytics disabled. |
| `EXPO_ASC_API_KEY_BASE64`          | Secret   | Base64-encoded App Store Connect `.p8` key (`base64 -i AuthKey_XXXXX.p8`).       |
| `EXPO_APPLE_APP_SPECIFIC_PASSWORD` | Secret   | Optional fallback when not using an ASC API key.                                 |
| `EXPO_OWNER`                       | Variable | Expo account / org slug that owns the project.                                   |
| `EXPO_PROJECT_ID`                  | Variable | EAS project ID from `app.config.ts`.                                             |
| `EXPO_ASC_APP_ID`                  | Variable | Numeric App Store Connect app ID.                                                |
| `EXPO_ASC_KEY_ID`                  | Variable | Key ID matching the `.p8` secret.                                                |
| `EXPO_ASC_ISSUER_ID`               | Variable | App Store Connect issuer ID.                                                     |
| `EXPO_APPLE_TEAM_ID`               | Variable | Apple developer team ID.                                                         |
| `EXPO_APPLE_TEAM_TYPE`             | Variable | `INDIVIDUAL` or `COMPANY_OR_ORGANIZATION`.                                       |
| `EXPO_APPLE_ID`                    | Variable | Apple ID email used as a submit fallback.                                        |
| `EXPO_PUBLIC_API_BASE_URL`         | Variable | Production API URL inlined into the build.                                       |

The workflow validates that the required values are present before invoking EAS.

### Triggering a release

1. Bump `version` in `apps/mobile/package.json` (the build number is auto-incremented by EAS thanks to `production.autoIncrement: true`).
2. Open **Actions → App Store Mobile Release → Run workflow**.
3. Optionally fill **TestFlight "What to Test" notes** — they are forwarded to `eas build --auto-submit --what-to-test`.
4. EAS queues an iOS build, signs it with the credentials managed in EAS, and submits the resulting `.ipa` to App Store Connect.
5. TestFlight processing takes ~10–30 minutes. Once Apple finishes processing, distribute the build to internal/external groups from App Store Connect.

### Local fallback

When you need to bypass GitHub Actions (e.g. to debug a failing build):

```bash
cd apps/mobile
pnpm exec eas login
pnpm exec eas build --platform ios --profile production --auto-submit
# or build only, then submit later
pnpm exec eas build --platform ios --profile production
pnpm exec eas submit --platform ios --latest
```

The same env vars listed above must be available locally (export them from your shell) for the submit step to find App Store Connect credentials.
