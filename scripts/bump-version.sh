#!/usr/bin/env bash
# Bumps package version (semver).
# Usage: ./scripts/bump-version.sh [patch|minor|major] [mobile|api|contracts]
set -euo pipefail

BUMP="${1:-patch}"
PACKAGE="${2:-mobile}"

case "$PACKAGE" in
  mobile)    PKG_PATH="apps/mobile/package.json";    SCOPE="mobile" ;;
  api)       PKG_PATH="apps/api/package.json";       SCOPE="api" ;;
  contracts) PKG_PATH="packages/contracts/package.json"; SCOPE="contracts" ;;
  *)
    echo "Usage: $0 [patch|minor|major] [mobile|api|contracts]" >&2
    exit 1
    ;;
esac

if [[ "$BUMP" != "patch" && "$BUMP" != "minor" && "$BUMP" != "major" ]]; then
  echo "Usage: $0 [patch|minor|major] [mobile|api|contracts]" >&2
  exit 1
fi

current=$(node -p "require('./${PKG_PATH}').version")
IFS='.' read -r major minor patch <<< "$current"

case "$BUMP" in
  major) major=$((major + 1)); minor=0; patch=0 ;;
  minor) minor=$((minor + 1)); patch=0 ;;
  patch) patch=$((patch + 1)) ;;
esac

next="${major}.${minor}.${patch}"

node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('${PKG_PATH}', 'utf8'));
pkg.version = '${next}';
fs.writeFileSync('${PKG_PATH}', JSON.stringify(pkg, null, 2) + '\n');
"

echo "Bumped ${SCOPE} ${current} → ${next} (${BUMP})"

git add "${PKG_PATH}"
git commit -m "chore(${SCOPE}): bump version to ${next}"

if [[ "$PACKAGE" == "mobile" ]]; then
  git tag -a "v${next}" -m "v${next}"
  echo "Created commit and tag v${next}"
else
  echo "Created commit (no tag for ${SCOPE})"
fi
