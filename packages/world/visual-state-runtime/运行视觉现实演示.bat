@echo off
chcp 65001 >nul
cd /d "%~dp0"
call npm run build || exit /b 1
node dist/packages/cli/src/cli.js visual-render examples/visual-reality-showcase.vsr.json examples/visual-reality-showcase.config.json --time 0 --out outputs/visual-reality-v02/cinematic.png
if errorlevel 1 exit /b 1
echo 已生成 outputs\visual-reality-v02\cinematic.png
pause
