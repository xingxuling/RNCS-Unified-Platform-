#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
node scripts/bootstrap-local-workspaces.mjs
npm run verify
npm run test:asset-forge
npm test --workspace @taowind/reality-asset-genesis-fabric
npm test --workspace @taowind/reality-studio-native
