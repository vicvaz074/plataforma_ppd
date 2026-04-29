#!/bin/sh
set -eu

interval="${BACKUP_INTERVAL_SECONDS:-43200}"

while true; do
  echo "[backup-runner] $(date -u +"%Y-%m-%dT%H:%M:%SZ") ejecutando respaldo on-premise"
  /workspace/scripts/onprem_backup.sh

  if [ "${BACKUP_RUN_ONCE:-false}" = "true" ]; then
    exit 0
  fi

  sleep "$interval"
done
