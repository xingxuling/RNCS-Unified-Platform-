@echo off
chcp 65001 >nul
call npm run build
start http://127.0.0.1:4173/dist/apps/webgpu-v03/index.html
node dist/packages/cli/src/cli.js serve --port 4173
