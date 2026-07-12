#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
node src/cli.mjs build --config examples/reality-build.json
