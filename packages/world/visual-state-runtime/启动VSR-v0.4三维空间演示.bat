@echo off
cd /d %~dp0
call npm run build
start "" http://127.0.0.1:4173/dist/apps/spatial-v04/index.html
node dist/packages/cli/src/cli.js serve examples/hello-title.vsr.json --port 4173
