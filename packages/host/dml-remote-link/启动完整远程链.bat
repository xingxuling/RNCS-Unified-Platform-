@echo off
chcp 65001 >nul
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\start-remote-stack.ps1
pause
