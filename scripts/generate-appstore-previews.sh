#!/usr/bin/env bash
#
# generate-appstore-previews.sh
#
# Composites raw iPhone screenshots onto a clean, brand-aligned background
# matching the bookscompare.mmc.dev website style (warm cream / orange accent),
# adding a Traditional Chinese headline + subtitle above each shot.
#
# Output sizes match the App Store iPhone 6.5" / 6.7" requirements:
#   1284x2778  (iPhone 6.7", default)
#   2778x1284  (iPhone 6.7" landscape)
#   1242x2688  (iPhone 6.5")
#   2688x1242  (iPhone 6.5" landscape)
#
# Requirements: ImageMagick 7+ (`brew install imagemagick`)
#
# Usage:
#   ./scripts/generate-appstore-previews.sh
#   ./scripts/generate-appstore-previews.sh --size 1242x2688
#   ./scripts/generate-appstore-previews.sh --input-dir ./assets
#   ./scripts/generate-appstore-previews.sh --no-captions

set -euo pipefail

# -- Defaults ----------------------------------------------------------
CANVAS_SIZE="1284x2778"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
INPUT_DIR="$REPO_ROOT/assets"
OUTPUT_DIR="$REPO_ROOT/appstore-previews"
CORNER_RADIUS=48
CAPTION_FONT_SIZE=110
CAPTION_COLOR="#1a1208"
SUBCAPTION_FONT_SIZE=46
SUBCAPTION_COLOR="#8a7a68"

# Brand palette (matches bookscompare.mmc.dev marketing site)
BG_COLOR="#FBF6EE"            # warm cream
ACCENT_COLOR="#C05631"        # rust orange (app accent)

# -- Font discovery (Traditional Chinese capable) ----------------------
# Prefer PingFang TC if reachable, otherwise fall back to STHeiti.
PINGFANG_PATH="$(find /System/Library/AssetsV2/com_apple_MobileAsset_Font8 \
  -name 'PingFang.ttc' 2>/dev/null | head -n 1 || true)"

if [[ -n "${PINGFANG_PATH:-}" && -r "$PINGFANG_PATH" ]]; then
  CAPTION_FONT="$PINGFANG_PATH"
  SUBCAPTION_FONT="$PINGFANG_PATH"
else
  CAPTION_FONT="/System/Library/Fonts/STHeiti Medium.ttc"
  SUBCAPTION_FONT="/System/Library/Fonts/STHeiti Light.ttc"
fi

# Captions per screenshot (zh-Hant-TW). Index aligned with input order.
declare -a CAPTIONS=(
  "找好書，先比好書價"
  "售價、折扣，一目了然"
  "簡潔乾淨，專注比價"
)

declare -a SUBCAPTIONS=(
  "掃 ISBN 條碼或輸入書名，秒查台灣四大書店"
  "博客來．金石堂．誠品．城邦讀書花園 同時搜尋"
  "免註冊、無廣告，下載即可使用全部功能"
)

# -- Parse CLI args ----------------------------------------------------
while [[ $# -gt 0 ]]; do
  case "$1" in
    --size)        CANVAS_SIZE="$2"; shift 2 ;;
    --input-dir)   INPUT_DIR="$2";   shift 2 ;;
    --output-dir)  OUTPUT_DIR="$2";  shift 2 ;;
    --no-captions) CAPTIONS=(); SUBCAPTIONS=(); shift ;;
    -h|--help)
      echo "Usage: $0 [--size WxH] [--input-dir DIR] [--output-dir DIR] [--no-captions]"
      exit 0 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

CANVAS_W="${CANVAS_SIZE%x*}"
CANVAS_H="${CANVAS_SIZE#*x}"

mkdir -p "$OUTPUT_DIR"

echo "Canvas: ${CANVAS_W}x${CANVAS_H}"
echo "Input:  $INPUT_DIR"
echo "Output: $OUTPUT_DIR"
echo "Font:   $CAPTION_FONT"
echo ""

# -- Process each screenshot -------------------------------------------
index=0
for src in "$INPUT_DIR"/screenshot-*.png; do
  [ -f "$src" ] || continue
  fname="$(basename "$src")"
  out="$OUTPUT_DIR/preview-${fname#screenshot-}"
  caption="${CAPTIONS[$index]:-}"
  subcaption="${SUBCAPTIONS[$index]:-}"

  echo "=> Processing $fname ..."

  # Layout: caption block at top, screenshot fills the rest with breathing room.
  if [ -n "$caption" ]; then
    # Screenshot occupies ~70% of canvas height, sitting below caption area.
    target_h=$(( CANVAS_H * 72 / 100 ))
    target_w=$(( CANVAS_W * 88 / 100 ))
    caption_y=$(( CANVAS_H * 7 / 100 ))
    subcaption_y=$(( caption_y + CAPTION_FONT_SIZE + 36 ))
    screenshot_y=$(( CANVAS_H * 24 / 100 ))
  else
    target_h=$(( CANVAS_H * 90 / 100 ))
    target_w=$(( CANVAS_W * 92 / 100 ))
    screenshot_y=$(( CANVAS_H * 5 / 100 ))
  fi

  tmp_resized="/tmp/bc_resized_${index}.png"
  tmp_mask="/tmp/bc_mask_${index}.png"
  tmp_rounded="/tmp/bc_rounded_${index}.png"
  tmp_shadowed="/tmp/bc_shadowed_${index}.png"

  # Step 1: Resize screenshot to fit target box while preserving aspect ratio.
  magick "$src" -resize "${target_w}x${target_h}" -strip "$tmp_resized"

  rw="$(magick identify -format '%w' "$tmp_resized")"
  rh="$(magick identify -format '%h' "$tmp_resized")"

  # Step 2: Round the corners with a mask.
  magick -size "${rw}x${rh}" xc:none \
    -fill white \
    -draw "roundRectangle 0,0 $((rw-1)),$((rh-1)) ${CORNER_RADIUS},${CORNER_RADIUS}" \
    "$tmp_mask"

  magick "$tmp_resized" "$tmp_mask" \
    -alpha off -compose CopyOpacity -composite \
    "$tmp_rounded"

  # Step 3: Soft drop shadow for depth on the cream background.
  magick "$tmp_rounded" \
    \( +clone -background "rgba(40,20,5,0.18)" -shadow "60x24+0+12" \) \
    +swap -background none -layers merge +repage \
    "$tmp_shadowed"

  # Step 4: Build the canvas, paint a subtle accent bar at the very top,
  # then composite the screenshot.
  accent_h=$(( CANVAS_H * 6 / 1000 ))
  magick -size "${CANVAS_W}x${CANVAS_H}" "xc:${BG_COLOR}" \
    \( -size "${CANVAS_W}x${accent_h}" "xc:${ACCENT_COLOR}" \) \
      -gravity north -geometry "+0+0" -compose over -composite \
    "$tmp_shadowed" -gravity north -geometry "+0+${screenshot_y}" -compose over -composite \
    "$out"

  # Step 5: Headline + subtitle.
  if [ -n "$caption" ]; then
    magick "$out" \
      -gravity north \
      -font "$CAPTION_FONT" \
      -pointsize "$CAPTION_FONT_SIZE" \
      -fill "$CAPTION_COLOR" \
      -annotate "+0+${caption_y}" "$caption" \
      "$out"
  fi

  if [ -n "$subcaption" ]; then
    magick "$out" \
      -gravity north \
      -font "$SUBCAPTION_FONT" \
      -pointsize "$SUBCAPTION_FONT_SIZE" \
      -fill "$SUBCAPTION_COLOR" \
      -annotate "+0+${subcaption_y}" "$subcaption" \
      "$out"
  fi

  rm -f "$tmp_resized" "$tmp_mask" "$tmp_rounded" "$tmp_shadowed"

  dims="$(magick identify -format '%wx%h' "$out")"
  echo "  Done: $out ($dims)"
  index=$((index + 1))
done

echo ""
echo "Generated $index App Store preview(s) in $OUTPUT_DIR/"
echo "Accepted sizes: 1284x2778, 2778x1284, 1242x2688, 2688x1242"
