#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")/../.."
exec node examples/two-player-loopback/demo-server.mjs
