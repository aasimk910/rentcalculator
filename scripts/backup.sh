#!/bin/sh
# Monthly MongoDB dump for the self-hosted stack, keeping the newest 12 (one year).
# Dumps go to /mnt/storage/backups so the restic off-site job picks them up.
set -eu
cd "$(dirname "$0")/.."

DIR="${BACKUP_DIR:-/mnt/storage/backups/rentcalculator}"
if ! mkdir -p "$DIR" 2>/dev/null || [ ! -w "$DIR" ]; then
    echo "Cannot write to $DIR; using ./backups instead" >&2
    DIR=./backups
    mkdir -p "$DIR"
fi

umask 077
OUT="$DIR/rentcalculator-$(date +%F).archive.gz"
docker compose exec -T mongo mongodump --db rentcalculator --archive --gzip --quiet > "$OUT.tmp"
mv "$OUT.tmp" "$OUT"
ls -1t "$DIR"/rentcalculator-*.archive.gz | tail -n +"$((${KEEP:-12} + 1))" | xargs -r rm --
echo "$(date -Is) backup written: $OUT"
