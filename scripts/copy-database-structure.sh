#!/usr/bin/env bash
# Copies a database's structure (no club data), plus its list of database changes already
# applied, into an empty throwaway database, so the new changes can be tried there first.
#
#   scripts/copy-database-structure.sh <from database URL> <throwaway database URL>
#
# Used by the release (.github/workflows/release.yml, copying the real database) and by every
# pull request (.github/workflows/ci.yml, copying main's database built from scratch), so a
# change that would stop a release is caught before it is merged. Needs pg_dump and psql at
# least as new as the source database; $PG_BIN can point at them.
set -euo pipefail

from="$1"
to="$2"
bin="${PG_BIN:+$PG_BIN/}"

# Accounts belong to the database server, not the database, so a copy never includes them.
# Make the website's account (golf_app) as it exists on the real database, unable to log in:
# database changes that set its rights need it.
psql -q -v ON_ERROR_STOP=1 "$to" -c "CREATE ROLE golf_app NOLOGIN"

"${bin}pg_dump" --schema-only --no-owner --no-privileges "$from" | psql -q -v ON_ERROR_STOP=1 "$to"
if [ "$(psql "$from" -Atc "SELECT to_regclass('public.payload_migrations') IS NOT NULL")" = "t" ]; then
  "${bin}pg_dump" --data-only --no-owner --table=payload_migrations "$from" | psql -q -v ON_ERROR_STOP=1 "$to"
fi
