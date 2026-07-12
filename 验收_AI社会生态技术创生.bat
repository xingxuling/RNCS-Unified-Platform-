@echo off
setlocal
cd /d "%~dp0"
node scripts\bootstrap-local-workspaces.mjs || exit /b 1
call npm test --workspace @taowind/reality-asset-genesis-fabric || exit /b 1
call npm test --workspace @taowind/reality-one-gateway || exit /b 1
call npm run test:integration || exit /b 1
call npm run health || exit /b 1
