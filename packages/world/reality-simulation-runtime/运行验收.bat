@echo off
chcp 65001 >nul
call npm run lint || goto :fail
call npm run typecheck || goto :fail
call npm run test || goto :fail
call npm run test:e2e || goto :fail
call npm run demo || goto :fail
call npm run verify || goto :fail
echo.
echo VSR 验收全部通过。
pause
exit /b 0
:fail
echo.
echo 验收失败，请查看上方日志。
pause
exit /b 1
