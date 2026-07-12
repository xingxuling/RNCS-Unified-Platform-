@echo off
chcp 65001 >nul
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\install-autostart.ps1
pause
