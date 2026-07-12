@echo off
cd /d "%~dp0"
npm run verify || exit /b 1
node scripts\bootstrap-local-workspaces.mjs || exit /b 1
npm test --workspace @taowind/reality-simulation-runtime || exit /b 1
npm test --workspace @taowind/visual-state-runtime || exit /b 1
npm run test:network || exit /b 1
npm run test:playable
