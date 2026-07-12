@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 正在启动 Reality Studio v1.1 TileMap导航原生版...
node src/cli.mjs serve --host 127.0.0.1 --port 17608
pause
