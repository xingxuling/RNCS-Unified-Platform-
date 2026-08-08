@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0package-anime-forge-phase6-6-local-evidence.ps1" %*
exit /b %ERRORLEVEL%
