@echo off
chcp 65001 >nul
cd /d "%~dp0"
if not exist node_modules npm install
node src\web-host.mjs --port 17801
pause
