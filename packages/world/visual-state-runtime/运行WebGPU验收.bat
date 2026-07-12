@echo off
chcp 65001 >nul
call npm run release:audit:v03
pause
