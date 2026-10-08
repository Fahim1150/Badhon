#!/bin/sh
set -eu

: "${MONGO_URI:?Set MONGO_URI to the authenticated production database URI}"

BACKUP_DIR=${BACKUP_DIR:-./backups}
RETENTION_DAYS=${RETENTION_DAYS:-30}

case "$RETENTION_DAYS" in
    ''|*[!0-9]*)
        echo "RETENTION_DAYS must be a non-negative integer" >&2
        exit 2
        ;;
esac

if ! command -v mongodump >/dev/null 2>&1; then
    echo "mongodump is required (MongoDB Database Tools)" >&2
    exit 127
fi

umask 077
mkdir -p "$BACKUP_DIR"
timestamp=$(date -u +%Y%m%dT%H%M%SZ)
backup_file="$BACKUP_DIR/badhon-$timestamp.archive.gz"
temporary_file="$backup_file.tmp"
trap 'rm -f "$temporary_file"' EXIT HUP INT TERM

mongodump --uri="$MONGO_URI" --archive="$temporary_file" --gzip
mv "$temporary_file" "$backup_file"
find "$BACKUP_DIR" -type f -name 'badhon-*.archive.gz' -mtime "+$RETENTION_DAYS" -delete

printf 'Backup created: %s\n' "$backup_file"