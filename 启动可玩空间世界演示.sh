#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
node scripts/bootstrap-local-workspaces.mjs
npm run demo:playable
