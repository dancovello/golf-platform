#!/bin/sh
# Vercel build entry point (set as the project's Build Command: pnpm vercel-build).
# VERCEL_TARGET_ENV is "production", "preview", or a custom environment name such as "staging".
set -eu

case "${VERCEL_TARGET_ENV:-}" in
  production)
    # Production is created in build step 3, once backups and a restore drill are proven.
    echo "Refusing to build production: it is not set up until build step 3." >&2
    exit 1
    ;;
  staging)
    echo "Staging: applying committed migrations before building."
    pnpm migrate
    ;;
  *)
    # Pull-request previews share the staging database for now, so they never migrate it.
    echo "Preview (${VERCEL_TARGET_ENV:-unknown}): building without migrations."
    ;;
esac

pnpm build
