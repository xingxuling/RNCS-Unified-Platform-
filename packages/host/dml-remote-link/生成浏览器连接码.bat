@echo off
chcp 65001 >nul
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\create-browser-code.ps1
pause
