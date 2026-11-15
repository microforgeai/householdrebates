#!/usr/bin/env bash
set -euo pipefail

# Default is the "hostinger-vps" alias in ~/.ssh/config (user + key for 72.61.117.132).
# On a machine without that alias, set VPS_HOST=user@72.61.117.132.
VPS_HOST="${VPS_HOST:-hostinger-vps}"
REMOTE_ROOT="/opt/householdrebates-api"

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

echo "Building and testing API release $REL..."
npm ci
npm --workspace=api run typecheck
npm --workspace=api run test
npm --workspace=api run build

echo "Syncing API release to $VPS_HOST:$REMOTE_ROOT/releases/$REL/..."
ssh "$VPS_HOST" "mkdir -p $REMOTE_ROOT/releases/$REL"
rsync -az --delete api/dist api/package.json api/installers.json package-lock.json "$VPS_HOST:$REMOTE_ROOT/releases/$REL/"

echo "Installing production dependencies and swapping symlink on $VPS_HOST..."
ssh "$VPS_HOST" "cd $REMOTE_ROOT/releases/$REL && npm ci --omit=dev && cd $REMOTE_ROOT && ln -sfn releases/$REL current.tmp && mv -Tf current.tmp current && sudo systemctl restart hr-leads"

echo "Checking API health..."
if ! ssh "$VPS_HOST" "curl -fsS http://127.0.0.1:8787/health" | grep -q '"ok":true'; then
  echo "API health check failed! Rolling back..." >&2
  VPS_HOST="$VPS_HOST" ./ops/rollback.sh api
  exit 1
fi

ssh "$VPS_HOST" "cd $REMOTE_ROOT && ls -1dt releases/* | tail -n +6 | xargs -r rm -rf"
echo "API release $REL deployed and healthy."
