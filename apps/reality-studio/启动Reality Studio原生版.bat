@echo off
setlocal EnableExtensions
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 goto NODE_MISSING

rem Reality Graph needs the local Adapter API. Do not open web\reality-graph.html directly.
powershell -NoProfile -ExecutionPolicy Bypass -Command "$health='http://127.0.0.1:17608/api/health'; function Test-Studio { try { (Invoke-WebRequest -UseBasicParsing -Uri $health -TimeoutSec 1).StatusCode -eq 200 } catch { $false } }; $ready=Test-Studio; if (-not $ready) { Start-Process -FilePath 'node.exe' -ArgumentList @('src/cli.mjs','serve','--host','127.0.0.1','--port','17608') -WorkingDirectory (Get-Location).Path -WindowStyle Hidden; for ($i=0; $i -lt 40; $i++) { Start-Sleep -Milliseconds 250; if (Test-Studio) { $ready=$true; break } } }; if ($ready) { Start-Process 'http://127.0.0.1:17608/'; exit 0 }; exit 1"
if errorlevel 1 goto START_FAILED
exit /b 0

:NODE_MISSING
echo [RNCS Reality Studio] Node.js 20 or newer is required to start the real Runtime.
echo Install Node.js, then run this launcher again.
pause
exit /b 1

:START_FAILED
echo [RNCS Reality Studio] The local Runtime service did not become healthy on http://127.0.0.1:17608/.
echo Check whether another process owns the port or inspect the local Studio logs.
pause
exit /b 1
