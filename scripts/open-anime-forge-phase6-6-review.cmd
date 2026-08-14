@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0open-anime-forge-phase6-6-review.ps1" %*
exit /b %ERRORLEVEL%
