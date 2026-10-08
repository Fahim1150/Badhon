#!/bin/sh
set -eu

: "${MONGO_BACKUP_URI:?Set MONGO_BACKUP_URI to the authenticated loopback database URI}"
: "${BACKUP_RCLONE_DEST:?Set BACKUP_RCLONE_DEST to the encrypted off-site rclone destination}"
: "${RCLONE_CONFIG:?Set RCLONE_CONFIG to the protected rclone configuration file}"

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

if ! command -v rclone >/dev/null 2>&1; then
    echo "rclone is required for the encrypted off-site backup" >&2
    exit 127
fi

umask 077
mkdir -p "$BACKUP_DIR"
timestamp=$(date -u +%Y%m%dT%H%M%SZ)
backup_file="$BACKUP_DIR/badhon-$timestamp.archive.gz"
temporary_file="$backup_file.tmp"
trap 'rm -f "$temporary_file"' EXIT
trap 'exit 1' HUP INT TERM

mongodump --uri="$MONGO_BACKUP_URI" --archive="$temporary_file" --gzip
mv "$temporary_file" "$backup_file"
rclone copy --config "$RCLONE_CONFIG" "$backup_file" "$BACKUP_RCLONE_DEST"

if [ "$RETENTION_DAYS" -gt 0 ]; then
    rclone delete --config "$RCLONE_CONFIG" \
        --include 'badhon-*.archive.gz' \
        --min-age "${RETENTION_DAYS}d" \
        "$BACKUP_RCLONE_DEST"
    find "$BACKUP_DIR" -type f -name 'badhon-*.archive.gz' -mtime "+$RETENTION_DAYS" -delete
fi

printf 'Backup created and copied off-site: %s\n' "$backup_file"