# Fastlane

Drives App Store Connect metadata releases for BooksCompare iOS.

The binary itself is built and uploaded to TestFlight by EAS via
[`.github/workflows/appstore-mobile.yml`](../../../.github/workflows/appstore-mobile.yml).
Fastlane only handles the App Store version + localized release notes.

## Lanes

- `fastlane ios release_appstore` — create the App Store version for the current
  `package.json` version, attach the latest processed TestFlight build, and
  upload `metadata/<locale>/release_notes.txt` for every supported locale.
  Does **not** submit for review by default.
- `fastlane ios release_appstore_dry_run` — `deliver --verify-only`, useful
  locally without an App Store Connect key.

### Options

```bash
bundle exec fastlane ios release_appstore \
  version:2.0.1 \
  build_number:42 \
  release_type:manual \
  submit_for_review:false
```

| Option              | Default                           | Notes                                     |
| ------------------- | --------------------------------- | ----------------------------------------- |
| `version`           | `package.json` version            | App Store version to create / update.     |
| `build_number`      | latest processed TestFlight build | Override when multiple builds exist.      |
| `release_type`      | `manual`                          | `manual` \| `automatic` \| `phased`.      |
| `submit_for_review` | `false`                           | Set `true` to also submit for App Review. |

## Metadata layout

```
metadata/
├── en-US/release_notes.txt
└── zh-Hant/release_notes.txt
```

Keep each `release_notes.txt` ≤ 4000 chars (App Store hard limit). The CI
workflow runs [`scripts/validate-release-notes.sh`](../../../scripts/validate-release-notes.sh)
on every PR.

## Required environment

Same App Store Connect API key used by EAS:

- `EXPO_ASC_API_KEY_PATH` — path to the `.p8` key file (the CI workflow
  decodes `EXPO_ASC_API_KEY_BASE64` into `apps/mobile/.tmp/AuthKey.p8`).
- `EXPO_ASC_KEY_ID`
- `EXPO_ASC_ISSUER_ID`
- `EXPO_APPLE_TEAM_ID` (optional, only needed for explicit team selection)
- `APP_IDENTIFIER` (optional, defaults to `com.andrewmmc.BookPriceApp`)
