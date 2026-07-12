@echo off
cd /d "%~dp0"
call npm run verify:experience-fabric
pause
