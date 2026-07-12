@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul || (echo 未检测到 Node.js 20+ & pause & exit /b 1)
echo 启动 Reality Studio v1.3 资产连续性原生版...
node src/cli.mjs serve --port 17608
pause
