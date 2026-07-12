@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul || (echo 需要 Node.js 20 或更高版本 & pause & exit /b 1)
node src/cli.mjs serve
pause
