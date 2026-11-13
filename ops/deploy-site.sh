#!/usr/bin/env bash
set -euo pipefail

VPS_HOST="${VPS_HOST:-deploy@72.61.117.132}"
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
if ! curl -fsS "https://householdrebates.com.au/" | grep -q "content=\"$REL\""; then
  echo "Smoke check failed! Rolling back..." >&2
  ./ops/rollback.sh site
  exit 1
fi

echo "Site release $REL deployed and verified."
