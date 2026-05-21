#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TARGET_DIR="${1:-$REPO_ROOT/appstore-previews}"

if ! command -v magick >/dev/null 2>&1; then
  echo "Error: ImageMagick 7+ is required. Install with: brew install imagemagick" >&2
  exit 1
fi

if [ ! -d "$TARGET_DIR" ]; then
  echo "Error: directory not found: $TARGET_DIR" >&2
  exit 1
fi

accepted_sizes=" 1284x2778 2778x1284 1242x2688 2688x1242 "
found=0
failed=0

echo "Validating App Store preview PNGs in $TARGET_DIR"
echo ""

for file in "$TARGET_DIR"/*.png; do
  [ -f "$file" ] || continue
  found=$((found + 1))

  dims="$(magick identify -format '%wx%h' "$file")"
  channels="$(magick identify -format '%[channels]' "$file" | tr '[:upper:]' '[:lower:]')"
  image_type="$(magick identify -format '%[type]' "$file")"
  name="$(basename "$file")"

  file_failed=0

  if [[ "$accepted_sizes" != *" $dims "* ]]; then
    echo "✗ $name: unsupported dimensions $dims"
    file_failed=1
  fi

  if [[ "$channels" == *a* ]]; then
    echo "✗ $name: has alpha channel ($channels)"
    file_failed=1
  fi

  if [[ "$image_type" != "TrueColor" && "$image_type" != "Palette" ]]; then
    echo "✗ $name: image type is $image_type, expected RGB truecolor/palette without alpha"
    file_failed=1
  fi

  if [ "$file_failed" -eq 0 ]; then
    echo "✓ $name: $dims, channels=$channels, type=$image_type"
  else
    failed=1
  fi
done

if [ "$found" -eq 0 ]; then
  echo "Error: no PNG files found in $TARGET_DIR" >&2
  exit 1
fi

if [ "$failed" -ne 0 ]; then
  echo ""
  echo "One or more previews are not App Store-safe. Regenerate with scripts/generate-appstore-previews.sh."
  exit 1
fi

echo ""
echo "All $found App Store preview PNG(s) are RGB/no-alpha and use accepted dimensions."
