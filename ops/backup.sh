#!/usr/bin/env bash
set -euo pipefail

DB_PATH="${DB_PATH:-/var/lib/householdrebates/leads.db}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/householdrebates}"
AGE_RECIPIENT="${AGE_RECIPIENT:-}"

if [[ -z "$AGE_RECIPIENT" ]]; then
  echo "Error: AGE_RECIPIENT public key must be set for encrypted backup." >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"
STAMP="$(TZ=Australia/Melbourne date +%Y%m%d)"
TMP_DB="$BACKUP_DIR/leads-$STAMP.db"
OUT_AGE="$BACKUP_DIR/leads-$STAMP.db.age"

sqlite3 "$DB_PATH" ".backup '$TMP_DB'"
age -r "$AGE_RECIPIENT" -o "$OUT_AGE" "$TMP_DB"
rm -f "$TMP_DB"

# Keep newest 30 encrypted backups
ls -1dt "$BACKUP_DIR"/leads-*.db.age 2>/dev/null | tail -n +31 | xargs -r rm -f
echo "Encrypted backup written to $OUT_AGE"
