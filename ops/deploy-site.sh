#!/usr/bin/env bash
set -euo pipefail

# Default is the "hostinger-vps" alias in ~/.ssh/config (user + key for 72.61.117.132).
# On a machine without that alias, set VPS_HOST=user@72.61.117.132.
VPS_HOST="${VPS_HOST:-hostinger-vps}"
REMOTE_ROOT="/var/www/householdrebates"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Error: Git working tree is dirty. Commit or stash changes first." >&2
  exit 1
fi

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$BRANCH" != "main" ]]; then
  echo "Error: Must deploy from main branch (currently on $BRANCH)." >&2
  exit 1
fi

REL="$(date +%Y%m%d-%H%M)-$(git rev-parse --short HEAD)"
export RELEASE_ID="$REL"
export PUBLIC_SERVER_COUNTRY="${PUBLIC_SERVER_COUNTRY:-Malaysia}"
export SERVER_COUNTRY="${SERVER_COUNTRY:-Malaysia}"

echo "Building and verifying site release $REL..."
npm ci
npm run check
npm run test
npm --workspace=site run build

echo "Syncing site/dist/ to $VPS_HOST:$REMOTE_ROOT/releases/$REL/..."
ssh "$VPS_HOST" "mkdir -p $REMOTE_ROOT/releases/$REL"
rsync -az --delete site/dist/ "$VPS_HOST:$REMOTE_ROOT/releases/$REL/"

echo "Swapping atomic symlink on $VPS_HOST..."
ssh "$VPS_HOST" "cd $REMOTE_ROOT && ln -sfn releases/$REL current.tmp && mv -Tf current.tmp current && ls -1dt releases/* | tail -n +6 | xargs -r rm -rf"

echo "Running smoke check..."
SMOKE_HTML="$(curl -fsS "https://householdrebates.com.au/")" || SMOKE_HTML=""
if ! grep -Fq "content=\"$REL\"" <<<"$SMOKE_HTML"; then
  echo "Smoke check failed! Rolling back..." >&2
  VPS_HOST="$VPS_HOST" ./ops/rollback.sh site
  exit 1
fi

echo "Site release $REL deployed and verified."

if [[ "${INDEXNOW:-0}" == "1" ]]; then
  echo "Submitting sitemap URLs via IndexNow..."
  ./ops/indexnow-ping.sh
fi
