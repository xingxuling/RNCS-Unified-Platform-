@echo off
chcp 65001 >nul
cd /d "%~dp0"
if not exist apps\seed-forge\node_modules call npm ci --prefix apps/seed-forge
call npm run dev --prefix apps/seed-forge
