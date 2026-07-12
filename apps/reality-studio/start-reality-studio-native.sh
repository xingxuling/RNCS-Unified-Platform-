#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
if command -v node >/dev/null 2>&1; then
  printf '%s
' 'Reality Studio v0.9: http://127.0.0.1:17608'
  node src/cli.mjs serve --host 127.0.0.1 --port 17608
else
  printf '%s
' 'Node.js not found. Open Reality_Studio_v0.9_场景资产行为统一制造工作台_离线版.html in a browser.'
fi
