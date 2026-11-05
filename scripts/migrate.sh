#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
source scripts/lib.sh "${1:-}"

if [ -n "${SAUTH_DEBUG_USER_ID:-}" ]; then
    echo "SAUTH_DEBUG_USER_ID is set in .env.$env, the debug seed would reach $PGHOST" >&2
    exit 1
fi

migrate_job
echo "migrate $PGDATABASE on $PGHOST as $PGUSER through $job on $SERVER_VERSION"
run_job
