@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul || (echo [错误] 未找到 Node.js 20+ & pause & exit /b 1)
call npm run demo:constraint-physics
if errorlevel 1 (echo [失败] 演示未完成 & pause & exit /b 1)
echo.
echo [完成] 输出：outputs\constraint-physics-demo
pause
