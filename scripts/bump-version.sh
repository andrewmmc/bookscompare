#!/usr/bin/env bash
# Bumps package version (semver).
# Usage: ./scripts/bump-version.sh [patch|minor|major] [mobile|api|contracts]
set -euo pipefail

REPO_ROOT=$(git rev-parse --show-toplevel)
cd "$REPO_ROOT"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Version bumps require a clean working tree and index." >&2
  exit 1
fi

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

if [[ "$PACKAGE" == "mobile" ]] && git rev-parse --verify --quiet "refs/tags/v${next}" >/dev/null; then
  echo "Tag v${next} already exists." >&2
  exit 1
fi

node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('${PKG_PATH}', 'utf8'));
pkg.version = '${next}';
fs.writeFileSync('${PKG_PATH}', JSON.stringify(pkg, null, 2) + '\n');
"

echo "Bumped ${SCOPE} ${current} → ${next} (${BUMP})"

npm install --package-lock-only --ignore-scripts

git add "${PKG_PATH}" package-lock.json
git commit -m "chore(${SCOPE}): bump version to ${next}"

if [[ "$PACKAGE" == "mobile" ]]; then
  git tag -a "v${next}" -m "v${next}"
  echo "Created commit and tag v${next}"
else
  echo "Created commit (no tag for ${SCOPE})"
fi
