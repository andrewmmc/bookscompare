#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
METADATA_DIR="$REPO_ROOT/apps/mobile/fastlane/metadata"
REQUIRED_LOCALES=("en-US" "zh-Hant")
MAX_BYTES=4000

failed=0

if [ ! -d "$METADATA_DIR" ]; then
  echo "Error: metadata directory not found: $METADATA_DIR" >&2
  exit 1
fi

for locale in "${REQUIRED_LOCALES[@]}"; do
  file="$METADATA_DIR/$locale/release_notes.txt"

  if [ ! -f "$file" ]; then
    echo "✗ Missing release notes: $file"
    failed=1
    continue
  fi

  if [ ! -s "$file" ]; then
    echo "✗ Empty release notes: $file"
    failed=1
    continue
  fi

  size="$(wc -c < "$file" | tr -d ' ')"
  if [ "$size" -gt "$MAX_BYTES" ]; then
    echo "✗ $file is $size bytes (App Store limit: $MAX_BYTES)"
    failed=1
    continue
  fi

  echo "✓ $locale: $size bytes"
done

if [ "$failed" -ne 0 ]; then
  echo ""
  echo "Update apps/mobile/fastlane/metadata/<locale>/release_notes.txt before releasing."
  exit 1
fi

echo ""
echo "All required release notes are present and within size limits."
