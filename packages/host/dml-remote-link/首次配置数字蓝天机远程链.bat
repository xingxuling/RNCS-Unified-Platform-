@echo off
chcp 65001 >nul
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\first-time-setup.ps1
pause
