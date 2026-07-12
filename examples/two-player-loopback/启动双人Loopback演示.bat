@echo off
chcp 65001 >nul
cd /d "%~dp0\..\.."
node examples\two-player-loopback\demo-server.mjs
pause
