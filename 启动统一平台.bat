@echo off
chcp 65001 >nul
where node >nul 2>nul || (echo 未检测到 Node.js 20 或以上版本。 & pause & exit /b 1)
if not exist node_modules call npm install
call npm run build:world
call npm run health
pause
