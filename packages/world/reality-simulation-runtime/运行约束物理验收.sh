#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
npm run verify:constraint-physics
printf '\n通过：Constraint Physics v0.2\n'
