@echo off
chcp 65001 >nul
where node >nul 2>nul
if errorlevel 1 (
  echo 未检测到 Node.js 20 或更高版本。
  pause
  exit /b 1
)
start "" http://127.0.0.1:4173
node dist\packages\cli\src\cli.js serve --port 4173
pause
