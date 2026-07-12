#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
npm install
exec npm run demo:network
