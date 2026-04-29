#!/usr/bin/env bash
set -euo pipefail

export LC_ALL=C
export LANG=C

usage() {
  echo "Uso: $0 [ruta ...]"
  echo "Si no se proporcionan rutas, se respaldan runtime/uploads, runtime/logs, env, nginx y un volcado SQL si PostgreSQL está disponible."
}

checksum_file() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1"
  else
    shasum -a 256 "$1"
  fi
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

backup_root="${BACKUP_OUTPUT_DIR:-./deploy/backups}"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
archive_name="${BACKUP_NAME:-davara-onprem-${timestamp}.tar.gz}"
retention_days="${BACKUP_RETENTION_DAYS:-14}"
tmp_dir="$(mktemp -d)"
cleanup() {
  rm -rf "$tmp_dir"
}
trap cleanup EXIT

mkdir -p "$backup_root"

if [[ "$#" -eq 0 ]]; then
  set -- ./deploy/runtime/uploads ./deploy/runtime/logs ./deploy/env ./deploy/nginx
fi

for path in "$@"; do
  if [[ ! -e "$path" ]]; then
    echo "Ruta inexistente para respaldo: $path" >&2
    exit 1
  fi
done

archive_path="${backup_root}/${archive_name}"
manifest_path="${archive_path%.tar.gz}.manifest.txt"
checksum_path="${archive_path}.sha256"
db_dump_path="${tmp_dir}/postgres-onprem.sql"
db_dump_included="false"

if [[ -n "${DATABASE_URL:-}" ]] && command -v pg_dump >/dev/null 2>&1; then
  pg_dump \
    --dbname "${DATABASE_URL}" \
    --clean \
    --if-exists \
    --no-owner \
    --no-privileges \
    --file "${db_dump_path}"
  db_dump_included="true"
fi

{
  echo "created_at_utc=${timestamp}"
  echo "working_directory=$(pwd)"
  echo "database_dump=${db_dump_included}"
  for path in "$@"; do
    echo "include=${path}"
  done
} > "$manifest_path"

if [[ "${db_dump_included}" == "true" ]]; then
  tar -czf "$archive_path" "$@" -C "$tmp_dir" "$(basename "$db_dump_path")"
else
  tar -czf "$archive_path" "$@"
fi
checksum_file "$archive_path" > "$checksum_path"

find "$backup_root" -type f -mtime +"${retention_days}" -delete

echo "Backup generado: $archive_path"
echo "Manifiesto: $manifest_path"
echo "Checksum: $checksum_path"
