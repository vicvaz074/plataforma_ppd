#!/usr/bin/env bash
set -euo pipefail

export LC_ALL=C
export LANG=C

usage() {
  echo "Uso: $0 <archivo.tar.gz> <directorio-destino>"
}

checksum_file() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | awk '{print $1}'
  else
    shasum -a 256 "$1" | awk '{print $1}'
  fi
}

if [[ "$#" -ne 2 ]]; then
  usage >&2
  exit 1
fi

archive_path="$1"
restore_root="$2"
checksum_path="${archive_path}.sha256"

if [[ ! -f "$archive_path" ]]; then
  echo "No existe el archivo de respaldo: $archive_path" >&2
  exit 1
fi

if [[ -f "$checksum_path" ]]; then
  expected_checksum="$(awk '{print $1}' "$checksum_path")"
  actual_checksum="$(checksum_file "$archive_path")"
  if [[ "$expected_checksum" != "$actual_checksum" ]]; then
    echo "El checksum no coincide para $archive_path" >&2
    exit 1
  fi
fi

mkdir -p "$restore_root"
tar -xzf "$archive_path" -C "$restore_root"

sql_dump_path="$(find "$restore_root" -name 'postgres-onprem.sql' -print -quit 2>/dev/null || true)"
if [[ -n "$sql_dump_path" ]] && [[ "${RESTORE_DATABASE:-false}" == "true" ]] && [[ -n "${DATABASE_URL:-}" ]] && command -v psql >/dev/null 2>&1; then
  psql "${DATABASE_URL}" -f "$sql_dump_path"
fi

echo "Respaldo restaurado en: $restore_root"
