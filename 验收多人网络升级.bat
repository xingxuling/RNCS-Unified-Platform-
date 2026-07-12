@echo off
chcp 65001 >nul
cd /d "%~dp0"
npm install
npm run test:network
npm run test:gateway
npm run test:integration
pause
