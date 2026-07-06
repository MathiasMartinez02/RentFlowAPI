#!/usr/bin/env bash
# Dumps the RentFlow database to a timestamped, gzip-compressed file under backups/.
#
# Usage:
#   ./scripts/backup-db.sh                      # reads DATABASE_URL from the environment
#   DB_HOST=... DB_USER=... DB_PASS=... DB_NAME=... ./scripts/backup-db.sh   # explicit vars
#
# DATABASE_URL takes precedence when set. Explicit DB_* vars are a fallback for setups
# that don't want to export the full connection string (e.g. some CI secret managers).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$SCRIPT_DIR/../backups}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"

if [ -n "${DATABASE_URL:-}" ]; then
  # mysql://user:pass@host:port/dbname
  DB_USER=$(echo "$DATABASE_URL" | sed -E 's#mysql://([^:]+):.*#\1#')
  DB_PASS=$(echo "$DATABASE_URL" | sed -E 's#mysql://[^:]+:([^@]+)@.*#\1#')
  DB_HOST=$(echo "$DATABASE_URL" | sed -E 's#.*@([^:/]+).*#\1#')
  DB_PORT=$(echo "$DATABASE_URL" | sed -E 's#.*:([0-9]+)/.*#\1#')
  DB_NAME=$(echo "$DATABASE_URL" | sed -E 's#.*/([^?]+).*#\1#')
fi

: "${DB_HOST:?Set DATABASE_URL or DB_HOST}"
: "${DB_PORT:=3306}"
: "${DB_USER:?Set DATABASE_URL or DB_USER}"
: "${DB_PASS:?Set DATABASE_URL or DB_PASS}"
: "${DB_NAME:?Set DATABASE_URL or DB_NAME}"

mkdir -p "$BACKUP_DIR"
OUTPUT_FILE="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql.gz"

echo "Backing up '$DB_NAME' from $DB_HOST:$DB_PORT..."
mysqldump \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --user="$DB_USER" \
  --password="$DB_PASS" \
  --single-transaction \
  --routines \
  --triggers \
  "$DB_NAME" | gzip > "$OUTPUT_FILE"

echo "Backup written to $OUTPUT_FILE ($(du -h "$OUTPUT_FILE" | cut -f1))"

# ── Automating this script ─────────────────────────────────────────────────
#
# Cron (self-hosted/VPS), daily at 3am, keeping 30 days of local backups:
#   0 3 * * * DATABASE_URL="mysql://user:pass@host:3306/rentflow" /path/to/scripts/backup-db.sh
#   0 4 * * * find /path/to/backups -name '*.sql.gz' -mtime +30 -delete
#
# GitHub Actions (scheduled workflow) — upload to your own storage after generating
# the dump; no credentials are wired here, add them as repo secrets before enabling:
#
# name: Scheduled DB Backup
# on:
#   schedule:
#     - cron: '0 3 * * *'
# jobs:
#   backup:
#     runs-on: ubuntu-latest
#     steps:
#       - uses: actions/checkout@v4
#       - name: Install mysql client
#         run: sudo apt-get update && sudo apt-get install -y mysql-client
#       - name: Run backup
#         env:
#           DATABASE_URL: ${{ secrets.DATABASE_URL }}
#         run: ./scripts/backup-db.sh
#       - name: Upload to S3 (example — replace with your own storage)
#         env:
#           AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
#           AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
#         run: aws s3 cp backups/*.sql.gz s3://your-backup-bucket/rentflow/
