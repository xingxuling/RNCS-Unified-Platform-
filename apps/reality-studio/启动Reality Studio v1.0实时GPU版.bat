@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 正在启动 Reality Studio v1.0 实时 GPU 制造版...
node src\cli.mjs serve --port 17608
if errorlevel 1 (
  echo.
  echo 启动失败，请确认已安装 Node.js 20 或更高版本。
  pause
)
