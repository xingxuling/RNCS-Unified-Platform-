#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"
node scripts/bootstrap-local-workspaces.mjs
npm test --workspace @taowind/reality-asset-genesis-fabric
npm test --workspace @taowind/reality-one-gateway
npm run test:integration
npm run health
