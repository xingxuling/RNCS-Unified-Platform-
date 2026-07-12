#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
echo "Starting Reality Studio v1.0 realtime GPU manufacturing edition..."
exec node src/cli.mjs serve --port 17608
