#!/usr/bin/env sh
set -eu
npm run build
printf '%s\n' 'Open: http://127.0.0.1:4173/dist/apps/webgpu-v03/index.html'
node dist/packages/cli/src/cli.js serve --port 4173
