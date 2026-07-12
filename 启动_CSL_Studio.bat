@echo off
chcp 65001 >nul
cd /d "%~dp0"
if not exist apps\csl-studio\node_modules call npm ci --prefix apps/csl-studio
call npm run dev --prefix apps/csl-studio
