#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
HOST="householdrebates.com.au"
KEY="651d4e162671bce57241a322c7a9cf4d"
KEY_FILE="$REPO_ROOT/site/public/${KEY}.txt"
SITEMAP_FILE="$REPO_ROOT/site/dist/sitemap-0.xml"

if [[ ! -f "$KEY_FILE" ]]; then
  echo "Error: IndexNow key file missing at $KEY_FILE" >&2
  exit 1
fi

if [[ ! -f "$SITEMAP_FILE" ]]; then
  echo "Error: Built sitemap missing at $SITEMAP_FILE (run site build first)." >&2
  exit 1
fi

PAYLOAD="$(node -e '
const fs = require("node:fs");
const [sitemapPath, host, key] = process.argv.slice(1);
const xml = fs.readFileSync(sitemapPath, "utf8");
const urlList = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
if (urlList.length === 0) {
  console.error("No <loc> entries found in sitemap.");
  process.exit(1);
}
process.stdout.write(JSON.stringify({
  host,
  key,
  keyLocation: `https://${host}/${key}.txt`,
  urlList,
}));
' "$SITEMAP_FILE" "$HOST" "$KEY")"

HTTP_STATUS="$(curl -fsS -o /dev/null -w "%{http_code}" \
  -X POST "https://api.indexnow.org/indexnow" \
  -H "Content-Type: application/json; charset=utf-8" \
  -d "$PAYLOAD")"

echo "IndexNow ping succeeded (HTTP $HTTP_STATUS)."
