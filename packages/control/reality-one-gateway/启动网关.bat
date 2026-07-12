@echo off
chcp 65001 >nul
where node >nul 2>nul || (echo 未检测到 Node.js 20 或以上版本。 & pause & exit /b 1)
cd /d "%~dp0"
node src\cli.mjs serve
pause
