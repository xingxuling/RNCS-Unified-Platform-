@echo off
chcp 65001 >nul
node src\host\cli.mjs run --state state\host --policy config\host-policy.example.json
pause
