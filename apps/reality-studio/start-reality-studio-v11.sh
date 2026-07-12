#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
node src/cli.mjs serve --host 127.0.0.1 --port 17608
