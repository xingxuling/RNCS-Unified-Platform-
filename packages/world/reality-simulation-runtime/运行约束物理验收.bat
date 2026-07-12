@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul || (echo [错误] 未找到 Node.js 20+ & pause & exit /b 1)
call npm run verify:constraint-physics
if errorlevel 1 (echo [失败] 验收未通过 & pause & exit /b 1)
echo.
echo [通过] Constraint Physics v0.2 验收完成
pause
