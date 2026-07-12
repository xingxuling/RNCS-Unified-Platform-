@echo off
cd /d "%~dp0"
node src\cli.mjs build --config examples\reality-build.json
pause
