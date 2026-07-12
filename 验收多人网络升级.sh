#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
npm install
npm run test:network
npm run test:gateway
npm run test:integration
