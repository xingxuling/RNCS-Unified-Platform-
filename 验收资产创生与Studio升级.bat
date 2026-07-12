@echo off
cd /d "%~dp0"
node scripts\bootstrap-local-workspaces.mjs || exit /b 1
npm run verify || exit /b 1
npm run test:asset-forge || exit /b 1
npm test --workspace @taowind/reality-asset-genesis-fabric || exit /b 1
npm test --workspace @taowind/reality-studio-native || exit /b 1
pause
