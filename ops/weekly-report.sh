#!/usr/bin/env bash
set -euo pipefail

# Cookieless weekly log analytics for householdrebates.com.au (solution-design §11).
# Parses the last 7 days of nginx hr_main access logs with GoAccess and runs
# ai-report.sh over the last 7 days of hr_ai logs.
# Writes report.html + report.txt to /var/lib/householdrebates/reports/<YYYY-Www>/
# (mode 0750 root:hr-reports, never under /var/www; reports contain no IP addresses)
# and keeps 12 weeks.

umask 027

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AI_REPORT_SH="${AI_REPORT_SH:-$SCRIPT_DIR/ai-report.sh}"

ACCESS_LOG="${ACCESS_LOG:-/var/log/nginx/householdrebates.access.log}"
AI_LOG="${AI_LOG:-/var/log/nginx/householdrebates.ai.log}"
REPORTS_BASE="${REPORTS_BASE:-/var/lib/householdrebates}"
REPORTS_ROOT="${REPORTS_ROOT:-$REPORTS_BASE/reports}"
REPORT_GROUP="${REPORT_GROUP:-hr-reports}"
KEEP_WEEKS="${KEEP_WEEKS:-12}"
DAYS_WINDOW="${DAYS_WINDOW:-7}"
REPORT_TZ="${REPORT_TZ:-Australia/Melbourne}"
WEEK_ID="${WEEK_ID:-$(TZ="$REPORT_TZ" date +%G-W%V)}"

# Compute UTC YYYY-MM-DD cutoff (GNU date on Ubuntu, BSD date fallback on macOS).
if CUTOFF_DATE="$(date -u -d "${DAYS_WINDOW} days ago" +%Y-%m-%d 2>/dev/null)"; then
  :
else
  CUTOFF_DATE="$(date -u -v-"${DAYS_WINDOW}"d +%Y-%m-%d)"
fi
GENERATED_AT="$(TZ="$REPORT_TZ" date '+%Y-%m-%d %H:%M:%S %Z')"

if ! command -v goaccess >/dev/null 2>&1; then
  echo "Error: goaccess is not installed." >&2
  exit 1
fi

if [[ ! -x "$AI_REPORT_SH" ]]; then
  echo "Error: ai-report.sh not found or not executable at $AI_REPORT_SH" >&2
  exit 1
fi

OUT_DIR="$REPORTS_ROOT/$WEEK_ID"
mkdir -p "$OUT_DIR"
chmod 0750 "$REPORTS_BASE" "$REPORTS_ROOT" "$OUT_DIR" 2>/dev/null || true

if [[ "$(id -u)" -eq 0 ]] && getent group "$REPORT_GROUP" >/dev/null 2>&1; then
  chgrp "$REPORT_GROUP" "$REPORTS_BASE" "$REPORTS_ROOT" "$OUT_DIR"
fi

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

ACCESS_SLICE="$TMP_DIR/access-7d.log"
AI_SLICE="$TMP_DIR/ai-7d.log"
GOACCESS_JSON="${GOACCESS_JSON:-$TMP_DIR/goaccess.json}"
: > "$ACCESS_SLICE"
: > "$AI_SLICE"

# Stream base log + rotated (.1 and .2.gz..10.gz) oldest-first, keeping lines >= CUTOFF_DATE.
collect_recent_lines() {
  local base="$1"
  local idx file

  for idx in 10 9 8 7 6 5 4 3 2; do
    file="${base}.${idx}.gz"
    if [[ -f "$file" ]]; then
      gzip -dc "$file"
    fi
  done
  if [[ -f "${base}.1" ]]; then
    cat "${base}.1"
  fi
  if [[ -f "$base" ]]; then
    cat "$base"
  fi
}

collect_recent_lines "$ACCESS_LOG" | awk -v cutoff="$CUTOFF_DATE" '
  match($0, /\[[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}/) {
    d = substr($0, RSTART + 1, 10)
    if (d >= cutoff) {
      # Normalise ISO-8601 offset delimiter (-HH:MM or Z) to + so GoAccess %t+%^ matches every offset.
      ts_end = RSTART + RLENGTH
      sep = substr($0, ts_end, 1)
      if (sep == "-" || sep == "Z") {
        print substr($0, 1, ts_end - 1) "+" substr($0, ts_end + 1)
      } else {
        print $0
      }
    }
  }
' > "$ACCESS_SLICE"

collect_recent_lines "$AI_LOG" | awk -v cutoff="$CUTOFF_DATE" '
  match($0, /\[[0-9]{4}-[0-9]{2}-[0-9]{2}T/) {
    d = substr($0, RSTART + 1, 10)
    if (d >= cutoff) print $0
  }
' > "$AI_SLICE"

ACCESS_LINES="$(wc -l < "$ACCESS_SLICE" | tr -d ' ')"
AI_LINES="$(wc -l < "$AI_SLICE" | tr -d ' ')"

HTML_OUT="$OUT_DIR/report.html"
TXT_OUT="$OUT_DIR/report.txt"

# nginx hr_main format:
#   $remote_addr [$time_iso8601] "$request" $status $body_bytes_sent "$http_referer" "$http_user_agent" rt=$request_time ai_ref=$hr_ai_ref ai_bot=$hr_ai_bot
# On UTC (+00:00) and Australian (+10:00/+11:00) servers, $time_iso8601 uses "+HH:MM" after %t.
HR_MAIN_LOG_FORMAT='%h [%dT%t+%^] "%r" %s %b "%R" "%u" rt=%T %^'

if [[ "$ACCESS_LINES" -gt 0 ]]; then
  goaccess "$ACCESS_SLICE" \
    --log-format="$HR_MAIN_LOG_FORMAT" \
    --date-format='%Y-%m-%d' \
    --time-format='%H:%M:%S' \
    --no-query-string \
    --ignore-panel=HOSTS \
    --anonymize-ip \
    --html-report-title="Household Rebates — Weekly Traffic ($WEEK_ID)" \
    -o "$HTML_OUT" \
    -o "$GOACCESS_JSON" \
    --no-progress

  python3 - "$GOACCESS_JSON" "$WEEK_ID" "$CUTOFF_DATE" "$GENERATED_AT" "$ACCESS_LINES" "$AI_LINES" > "$TXT_OUT" <<'PY'
import json
import sys

json_path, week_id, cutoff, generated_at, access_lines, ai_lines = sys.argv[1:7]
with open(json_path, "r", encoding="utf-8") as fh:
    data = json.load(fh)

gen = data.get("general", {})
print(f"Household Rebates — Weekly Log Report ({week_id})")
print(f"Generated:   {generated_at}")
print(f"Window:      UTC date >= {cutoff} ({access_lines} access lines, {ai_lines} AI lines)")
print(
    f"Totals:      {gen.get('total_requests', 0)} requests | "
    f"{gen.get('valid_requests', 0)} valid | "
    f"{gen.get('unique_visitors', 0)} unique daily IPs | "
    f"{gen.get('unique_not_found', 0)} unique 404 paths"
)
print("")

def print_panel(panel_key, title, limit=15):
    rows = (data.get(panel_key) or {}).get("data") or []
    print(f"=== {title} ===")
    if not rows:
        print("  (none)")
    else:
        for row in rows[:limit]:
            hits = row.get("hits", {})
            vis = row.get("visitors", {})
            h_cnt = hits.get("count", row.get("hits", 0)) if isinstance(hits, dict) else hits
            v_cnt = vis.get("count", row.get("visitors", 0)) if isinstance(vis, dict) else vis
            label = row.get("data", "")
            method = row.get("method", "")
            prefix = f"{method} " if method else ""
            print(f"  {h_cnt:>6} hits  {v_cnt:>5} vis  {prefix}{label}")
            for sub in (row.get("items") or [])[:limit]:
                sh = sub.get("hits", {})
                sv = sub.get("visitors", {})
                sh_cnt = sh.get("count", sub.get("hits", 0)) if isinstance(sh, dict) else sh
                sv_cnt = sv.get("count", sub.get("visitors", 0)) if isinstance(sv, dict) else sv
                print(f"      {sh_cnt:>6} hits  {sv_cnt:>5} vis    {sub.get('data', '')}")
    print("")

print_panel("requests", "Top Pages / Requests")
print_panel("not_found", "Top 404 Not Found URLs", limit=10)
print_panel("referring_sites", "Top Referring Domains", limit=15)
print_panel("referrers", "Top Full Referrer URLs", limit=10)
print_panel("status_codes", "HTTP Status Codes", limit=10)
PY
else
  cat > "$HTML_OUT" <<EOF
<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Household Rebates — Weekly Traffic ($WEEK_ID)</title></head>
<body>
  <h1>Household Rebates — Weekly Traffic ($WEEK_ID)</h1>
  <p>Generated: $GENERATED_AT. No access log entries matched UTC date &gt;= $CUTOFF_DATE.</p>
</body>
</html>
EOF

  cat > "$TXT_OUT" <<EOF
Household Rebates — Weekly Log Report ($WEEK_ID)
Generated:   $GENERATED_AT
Window:      UTC date >= $CUTOFF_DATE (0 access lines, $AI_LINES AI lines)

No access log entries matched the ${DAYS_WINDOW}-day window.

EOF
fi

"$AI_REPORT_SH" "$AI_SLICE" >> "$TXT_OUT"

chmod 0640 "$HTML_OUT" "$TXT_OUT"
if [[ "$(id -u)" -eq 0 ]] && getent group "$REPORT_GROUP" >/dev/null 2>&1; then
  chgrp "$REPORT_GROUP" "$HTML_OUT" "$TXT_OUT"
fi

# Prune week directories older than KEEP_WEEKS (ISO week names sort chronologically).
if [[ "$KEEP_WEEKS" =~ ^[0-9]+$ ]] && [[ "$KEEP_WEEKS" -ge 1 ]]; then
  START_IDX=$((KEEP_WEEKS + 1))
  (
    cd "$REPORTS_ROOT"
    ls -1d [0-9][0-9][0-9][0-9]-W[0-9][0-9] 2>/dev/null \
      | LC_ALL=C sort -r \
      | tail -n +"$START_IDX" \
      | xargs -r rm -rf
  )
fi

echo "Weekly report written to $OUT_DIR/ (report.html, report.txt)"
