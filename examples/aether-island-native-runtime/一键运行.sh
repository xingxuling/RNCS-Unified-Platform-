#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
node scripts/bootstrap-local-workspaces.mjs
node examples/aether-island-native-runtime/demo.mjs
