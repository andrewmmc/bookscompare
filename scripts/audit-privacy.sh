#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$REPO_ROOT"

echo "Privacy-related dependency/source audit"
echo "Repository: $REPO_ROOT"
echo ""

echo "== Analytics, crash reporting, and attribution SDKs =="
if ! rg -n -i \
  --glob 'package.json' \
  --glob 'apps/**/src/**' \
  --glob '!node_modules/**' \
  'posthog|firebase|sentry|amplitude|mixpanel|segment|appsflyer|branch|crashlytics|analytics|telemetry|tracking' \
  .; then
  echo "No analytics/crash/attribution references found."
fi

echo ""
echo "== Device identifiers, location, contacts, camera, microphone, and photos =="
if ! rg -n -i \
  --glob 'apps/**/src/**' \
  --glob 'apps/**/app.config.*' \
  --glob 'apps/**/app.json' \
  --glob '!node_modules/**' \
  'device|identifier|idfa|location|contacts|camera|microphone|photo|media-library|expo-camera|expo-location|expo-contacts|expo-device|advertising' \
  .; then
  echo "No sensitive device capability references found."
fi

echo ""
echo "Review the matches above before answering App Store privacy questions. This script is informational and does not fail on matches."
