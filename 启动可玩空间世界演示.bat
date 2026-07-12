@echo off
cd /d "%~dp0"
node scripts\bootstrap-local-workspaces.mjs || exit /b 1
npm run demo:playable
