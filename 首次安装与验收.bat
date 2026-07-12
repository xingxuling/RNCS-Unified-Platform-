@echo off
chcp 65001 >nul
cd /d "%~dp0"
call npm install
if errorlevel 1 exit /b 1
call npm run install:products
if errorlevel 1 exit /b 1
call npm run validate:release
if errorlevel 1 exit /b 1
echo.
echo 发布验收通过。完整CSL/IAL语言回归可另行运行 npm run test:languages
pause
