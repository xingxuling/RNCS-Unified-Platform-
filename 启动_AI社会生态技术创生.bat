@echo off
setlocal
set ROOT=%~dp0
node "%ROOT%packages\world\reality-asset-genesis-fabric\src\cli.mjs" generate-society --intent "%ROOT%packages\world\reality-asset-genesis-fabric\examples\ai-society-ecosystem.intent.json" --out "%ROOT%packages\world\reality-asset-genesis-fabric\outputs\ai-society-ecosystem"
if errorlevel 1 exit /b %errorlevel%
echo Generated: %ROOT%packages\world\reality-asset-genesis-fabric\outputs\ai-society-ecosystem\preview.html
