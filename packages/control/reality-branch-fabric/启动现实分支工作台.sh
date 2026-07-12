#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
printf '%s\n' 'Open http://127.0.0.1:4178'
node src/server.mjs 4178
