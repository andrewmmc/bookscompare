# BooksCompare Mobile

The mobile app lives here as an Expo SDK 54 workspace app with an iOS-first release target.

## Current feature set

- ISBN search by typing
- ISBN barcode scanning with `expo-camera`
- Search results rendered from `@bookscompare/contracts`
- In-app bookstore browsing with `react-native-webview`
- About page links routed through the shared web view screen
- Friendly empty/error states when the API or marketing pages are unavailable
- Traditional Chinese UI (`zh-TW`) with English strings kept in the codebase for future use
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

- `zh-TW` is currently the only enabled locale and the fallback for every device language.
- `en` strings remain in the dictionary for future use, but English is not currently enabled.

Re-export the resolved dictionary via `import { strings } from '../../i18n/strings'` from any screen or component. There is no runtime locale switcher.

When adding a new user-facing string:

1. Extend the `Dictionary` type in `dictionaries.ts`.
2. Provide both `zh-TW` and `en` values.
3. Reference the new key through `strings.<group>.<key>`.

## Analytics

Analytics goes through `src/analytics`. The provider is selected at module load time:

- If `EXPO_PUBLIC_POSTHOG_KEY` is set in the active build, the PostHog provider is used and `initAnalytics()` (called from `App.tsx`) constructs `posthog-react-native` with `captureAppLifecycleEvents: true`.
- Otherwise the no-op provider is used, so `track()` and `identify()` calls remain safe in development and in builds without an analytics key.

The PostHog SDK is `require()`d lazily so unit tests (which never call `initAnalytics`) do not need to mock the native module.

## Release flow

A full iOS release runs through two GitHub Actions workflows. Stage 1 ships the binary to TestFlight; stage 2 publishes the App Store version with localized release notes. Stage 2 never submits for review automatically — flip the switch in App Store Connect (or pass `submit_for_review=true`) when you're ready.

```diagram
╭────────────────────────────╮   ╭────────────────────────────╮   ╭──────────────────────╮
│ 1. Bump version + notes    │──▶│ 2. App Store Mobile Release│──▶│ TestFlight processing│
│    (PR merged to main)     │   │    (EAS build + submit)    │   │   (~10–30 min)       │
╰────────────────────────────╯   ╰────────────────────────────╯   ╰──────────┬───────────╯
                                                                              │
                                                                              ▼
                                 ╭────────────────────────────╮   ╭──────────────────────╮
                                 │ 4. Submit for Review       │◀──│ 3. App Store Release │
                                 │    (manual button in ASC)  │   │    Metadata          │
                                 ╰────────────────────────────╯   │    (Fastlane deliver)│
                                                                  ╰──────────────────────╯
```

### End-to-end usage flow

1. **Open a PR that bumps the release** —
   - bump `version` in [`apps/mobile/package.json`](./package.json)
   - update **every** locale under [`apps/mobile/fastlane/metadata/<locale>/release_notes.txt`](./fastlane/metadata) (currently `en-US` and `zh-Hant`)
   - CI runs [`scripts/validate-release-notes.sh`](../../scripts/validate-release-notes.sh) and fails if any locale is missing, empty, or > 4000 bytes
   - merge to `main`
2. **Run the TestFlight workflow** — **Actions → [App Store Mobile Release](../../.github/workflows/appstore-mobile.yml) → Run workflow**. Optionally fill `what_to_test`. Wait for EAS to build, submit, and for Apple to finish TestFlight processing (typically 10–30 min). You can confirm the build is ready in App Store Connect → TestFlight.
3. **Run the App Store metadata workflow** — **Actions → [App Store Release Metadata](../../.github/workflows/appstore-release.yml) → Run workflow**:
   - `version` — leave blank to use `package.json` version
   - `build_number` — leave blank to attach the latest processed build for that version
   - `release_type` — `manual` (default), `automatic`, or `phased`
   - `submit_for_review` — keep `false` unless you want to submit straight from CI
4. **Submit for review** — open App Store Connect, sanity-check the version, screenshots, and release notes, then hit _Add for Review_ / _Submit_. Re-run the metadata workflow with different inputs if you need to swap the build or update notes.

### Workflows at a glance

- [`App Store Mobile Release`](../../.github/workflows/appstore-mobile.yml) — builds the binary with EAS and uploads it to TestFlight (`eas build --platform ios --profile production --auto-submit`).
- [`App Store Release Metadata`](../../.github/workflows/appstore-release.yml) — once the build is processed, creates the App Store version, attaches the build, and uploads localized release notes via Fastlane `deliver`. Re-runnable; never submits for review unless explicitly asked.

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

### What the TestFlight workflow does

1. Reads `version` from `apps/mobile/package.json`. The iOS build number is auto-incremented by EAS thanks to `production.autoIncrement: true`.
2. Optionally accepts **TestFlight "What to Test" notes**, forwarded as `eas build --auto-submit --what-to-test`.
3. EAS queues an iOS build, signs it with the credentials managed in EAS, and submits the resulting `.ipa` to App Store Connect.
4. TestFlight processing takes ~10–30 minutes. Once processed, the build is available to TestFlight groups and to the App Store Release Metadata workflow.

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

### Local fallback for App Store metadata

```bash
cd apps/mobile
bundle install
export EXPO_ASC_API_KEY_PATH=/abs/path/to/AuthKey.p8
export EXPO_ASC_KEY_ID=...
export EXPO_ASC_ISSUER_ID=...
bundle exec fastlane ios release_appstore_dry_run   # validate metadata only
bundle exec fastlane ios release_appstore           # actually push to App Store Connect
```

See [`fastlane/README.md`](./fastlane/README.md) for the full lane reference.
