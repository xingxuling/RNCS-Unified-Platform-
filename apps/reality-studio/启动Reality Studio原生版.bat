@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 goto OFFLINE
start "" http://127.0.0.1:17608
node src\cli.mjs serve --host 127.0.0.1 --port 17608
if errorlevel 1 pause
exit /b
:OFFLINE
echo [Reality Studio v0.9] 未检测到 Node.js，打开离线行为工作台。
start "" "%~dp0Reality_Studio_v0.9_场景资产行为统一制造工作台_离线版.html"
exit /b
