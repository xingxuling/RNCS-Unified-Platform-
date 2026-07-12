@echo off
cd /d "%~dp0"
node scripts\bootstrap-local-workspaces.mjs
if errorlevel 1 exit /b %errorlevel%
npm run demo:asset-forge
pause
