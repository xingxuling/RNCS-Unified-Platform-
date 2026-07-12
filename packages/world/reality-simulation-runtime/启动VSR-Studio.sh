#!/usr/bin/env sh
set -eu
printf '%s\n' 'VSR Studio: http://127.0.0.1:4173'
node dist/packages/cli/src/cli.js serve --port 4173
