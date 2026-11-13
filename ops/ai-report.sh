#!/usr/bin/env bash
set -euo pipefail

LOG_FILE="${1:-/var/log/nginx/householdrebates.ai.log}"

if [[ ! -f "$LOG_FILE" ]]; then
  echo "AI referrer log not found at $LOG_FILE" >&2
  exit 1
fi

echo "=== Household Rebates AI Referrer & Crawler Summary ==="
echo ""
echo "--- Top AI Referrers (human clicks from AI assistants) ---"
grep -oE 'ai_ref=[a-z0-9-]+' "$LOG_FILE" | cut -d= -f2 | grep -v '^$' | sort | uniq -c | sort -rn || true

echo ""
echo "--- Top AI Crawlers / Bots ---"
grep -oE 'ai_bot=[a-z0-9-]+' "$LOG_FILE" | cut -d= -f2 | grep -v '^$' | sort | uniq -c | sort -rn || true

echo ""
echo "--- Top Requested URLs in AI Log ---"
awk -F'"' '{print $2}' "$LOG_FILE" | sort | uniq -c | sort -rn | head -n 20
