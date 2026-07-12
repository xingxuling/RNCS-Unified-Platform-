@echo off
chcp 65001 >nul
cd /d "%~dp0"
if not exist apps\aetherworld\node_modules call npm ci --prefix apps/aetherworld
call npm run dev:spa --prefix apps/aetherworld
