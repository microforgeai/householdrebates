#!/usr/bin/env bash
set -euo pipefail

TARGET="${1:-}"
VPS_HOST="${VPS_HOST:-deploy@72.61.117.132}"

if [[ "$TARGET" != "site" && "$TARGET" != "api" ]]; then
  echo "Usage: ./ops/rollback.sh site|api" >&2
  exit 1
fi

if [[ "$TARGET" == "site" ]]; then
  REMOTE_ROOT="/var/www/householdrebates"
  PREV="$(ssh "$VPS_HOST" "cd $REMOTE_ROOT && ls -1dt releases/* | sed -n '2p'")"
  if [[ -z "$PREV" ]]; then
    echo "No previous site release found to roll back to." >&2
    exit 1
  fi
  echo "Rolling back site to $PREV..."
  ssh "$VPS_HOST" "cd $REMOTE_ROOT && ln -sfn $PREV current.tmp && mv -Tf current.tmp current"
  curl -fsS -I "https://householdrebates.com.au/" | head -n 1
else
  REMOTE_ROOT="/opt/householdrebates-api"
  PREV="$(ssh "$VPS_HOST" "cd $REMOTE_ROOT && ls -1dt releases/* | sed -n '2p'")"
  if [[ -z "$PREV" ]]; then
    echo "No previous API release found to roll back to." >&2
    exit 1
  fi
  echo "Rolling back API to $PREV..."
  ssh "$VPS_HOST" "cd $REMOTE_ROOT && ln -sfn $PREV current.tmp && mv -Tf current.tmp current && sudo systemctl restart hr-leads"
  ssh "$VPS_HOST" "curl -fsS http://127.0.0.1:8787/health"
fi
