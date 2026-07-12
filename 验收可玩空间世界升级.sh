#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
npm run verify
node scripts/bootstrap-local-workspaces.mjs
npm test --workspace @taowind/reality-simulation-runtime
npm test --workspace @taowind/visual-state-runtime
npm run test:network
npm run test:playable
