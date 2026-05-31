#!/usr/bin/env bash
# Bumps apps/mobile version (semver). Usage: ./scripts/bump-version.sh [patch|minor|major]
set -euo pipefail

BUMP="${1:-patch}"
MOBILE_PKG="apps/mobile/package.json"

if [[ "$BUMP" != "patch" && "$BUMP" != "minor" && "$BUMP" != "major" ]]; then
  echo "Usage: $0 [patch|minor|major]" >&2
  exit 1
fi

current=$(node -p "require('./${MOBILE_PKG}').version")
IFS='.' read -r major minor patch <<< "$current"

case "$BUMP" in
  major) major=$((major + 1)); minor=0; patch=0 ;;
  minor) minor=$((minor + 1)); patch=0 ;;
  patch) patch=$((patch + 1)) ;;
esac

next="${major}.${minor}.${patch}"

# Update package.json
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('${MOBILE_PKG}', 'utf8'));
pkg.version = '${next}';
fs.writeFileSync('${MOBILE_PKG}', JSON.stringify(pkg, null, 2) + '\n');
"

echo "Bumped ${current} → ${next} (${BUMP})"

git add "${MOBILE_PKG}"
git commit -m "chore(mobile): bump version to ${next}"
git tag -a "v${next}" -m "v${next}"

echo "Created commit and tag v${next}"
