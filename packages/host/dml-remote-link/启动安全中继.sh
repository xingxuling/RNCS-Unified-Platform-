#!/usr/bin/env sh
set -eu
DML_ALLOWED_ORIGINS="${DML_ALLOWED_ORIGINS:-http://localhost:5173,http://127.0.0.1:5173}" \
node src/relay/cli.mjs serve --host 127.0.0.1 --port 17901 --state state/relay
