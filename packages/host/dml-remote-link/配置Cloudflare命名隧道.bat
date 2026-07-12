@echo off
chcp 65001 >nul
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\setup-cloudflare-tunnel.ps1
pause
