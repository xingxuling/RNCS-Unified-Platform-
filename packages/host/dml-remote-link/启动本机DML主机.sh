#!/usr/bin/env sh
set -eu
node src/host/cli.mjs run --state state/host --policy config/host-policy.example.json
