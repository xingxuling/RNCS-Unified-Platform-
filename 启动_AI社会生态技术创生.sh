#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
OUT="$ROOT/packages/world/reality-asset-genesis-fabric/outputs/ai-society-ecosystem"
node "$ROOT/packages/world/reality-asset-genesis-fabric/src/cli.mjs" generate-society \
  --intent "$ROOT/packages/world/reality-asset-genesis-fabric/examples/ai-society-ecosystem.intent.json" \
  --out "$OUT"
echo "已生成：$OUT/preview.html"
