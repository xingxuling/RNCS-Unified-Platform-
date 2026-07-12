#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
npm run build
node dist/packages/cli/src/cli.js visual-render examples/visual-reality-showcase.vsr.json examples/visual-reality-showcase.config.json --time 0 --out outputs/visual-reality-v02/cinematic.png
echo "已生成 outputs/visual-reality-v02/cinematic.png"
