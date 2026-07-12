#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
npm run demo:constraint-physics
printf '\n完成：outputs/constraint-physics-demo\n'
