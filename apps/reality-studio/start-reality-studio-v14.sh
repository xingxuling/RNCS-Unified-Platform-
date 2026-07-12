#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
node src/cli.mjs serve
