#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
npm run build
printf '%s\n' '打开：http://127.0.0.1:4173/dist/apps/spatial-v04/index.html'
node dist/packages/cli/src/cli.js serve examples/hello-title.vsr.json --port 4173
