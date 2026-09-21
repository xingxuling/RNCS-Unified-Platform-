@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0run-anime-forge-phase6-6-full-oneclick.ps1" %*
exit /b %ERRORLEVEL%
