#!/bin/sh
# Vercel build entry point (Build Command: pnpm vercel-build).
#
# Vercel never changes the database. Staging and production are deployed by the GitHub
# Release workflow (.github/workflows/release.yml), which takes a backup, tries the database
# changes on a copy, applies them with the owner account, and only then asks Vercel to deploy.
# Pull-request previews share the staging database and never change it.
set -eu
pnpm build
